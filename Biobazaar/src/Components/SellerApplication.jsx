/* eslint-disable react/no-unescaped-entities */
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiCheck, FiUpload } from "react-icons/fi";
import { api } from "../api";
import "./seller-hub.css";

const initialApplication = {
  sellerType: "individual", storeName: "", description: "", contactEmail: "", contactPhone: "",
  address: { line1: "", line2: "", city: "", region: "", postalCode: "", country: "IN" },
  individual: { legalName: "" },
  business: { legalName: "", registrationNumber: "", taxId: "" },
};
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const errorMessage = (error) => error.response?.data?.errors?.join(" ") || error.response?.data?.message || (error.response?.status === 413 || /file too large/i.test(error.message || "") ? "A document exceeds the 5 MB limit. Remove it, choose a smaller file, and retry." : "We could not save your application. Check your connection and try again.");
const formatSize = (bytes) => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const countryName = (code) => { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; } catch { return code; } };

export default function SellerApplication() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialApplication);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementVersion, setAgreementVersion] = useState("2026-01");
  const [registrationCountries, setRegistrationCountries] = useState(["IN"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const formRef = useRef(null);

  useEffect(() => {
    api.get("/seller/me").then(({ data }) => {
      const current = data.profile;
      setAgreementVersion(data.currentAgreementVersion || "2026-01");
      if (Array.isArray(data.registrationCountries) && data.registrationCountries.length) setRegistrationCountries(data.registrationCountries);
      setProfile(current);
      if (current) {
        setForm({ ...initialApplication, ...current, address: { ...initialApplication.address, ...current.address }, individual: { ...initialApplication.individual, ...current.individual }, business: { ...initialApplication.business, ...current.business } });
        setAgreementAccepted(Boolean(current.agreementAccepted && current.agreementVersion === data.currentAgreementVersion));
      }
    }).catch((requestError) => setError(errorMessage(requestError))).finally(() => setLoading(false));
  }, []);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateNested = (group, key, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
  const indiaOnly = registrationCountries.length === 1 && registrationCountries[0] === "IN";
  const registrationCountryNames = registrationCountries.map(countryName).join(", ");
  const chooseFiles = (event) => {
    const chosen = Array.from(event.target.files || []);
    event.target.value = "";
    const remaining = 8 - (profile?.verificationDocuments?.length || 0) - files.length;
    if (chosen.some((file) => !ALLOWED_FILES.has(file.type))) { setError("Choose PDF, JPEG, or PNG files only."); return; }
    if (chosen.some((file) => file.size > MAX_FILE_BYTES)) { setError("Each verification document must be 5 MB or smaller."); return; }
    if (chosen.length > Math.min(4, remaining)) { setError(`You can add up to ${Math.min(4, remaining)} more file(s) in this selection. Eight files are allowed per application.`); return; }
    setError(""); setFiles((current) => [...current, ...chosen]);
  };
  const removeUploadedDocument = async (storageKey) => {
    setSaving(true); setError(""); setMessage("");
    try {
      const { data } = await api.delete(`/seller/documents/${encodeURIComponent(storageKey)}`);
      setProfile(data.profile); setMessage("Document removed from your draft.");
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  };

  const saveDraft = async () => {
    setSaving(true); setError(""); setMessage("");
    try {
      const payload = new FormData();
      payload.append("application", JSON.stringify({ ...form, agreementAccepted }));
      files.forEach((file) => payload.append("documents", file));
      const endpoint = profile ? "/seller/applications/draft" : "/seller/applications";
      if (files.length) setUploadProgress(0);
      const { data } = await api({ method: profile ? "patch" : "post", url: endpoint, data: payload, onUploadProgress: files.length ? (event) => setUploadProgress(event.total ? Math.round((event.loaded * 100) / event.total) : null) : undefined });
      setProfile(data.profile); setAgreementVersion(data.currentAgreementVersion || agreementVersion); setFiles([]); setMessage("Draft saved securely.");
      setUploadProgress(null);
      return true;
    } catch (requestError) { setUploadProgress(null); setError(errorMessage(requestError)); return false; }
    finally { setSaving(false); }
  };

  const nextStep = async () => {
    if (!formRef.current?.reportValidity()) return;
    if (await saveDraft()) setStep((current) => Math.min(2, current + 1));
  };

  const submit = async () => {
    if (!agreementAccepted) { setError("Accept the seller agreement before submitting."); return; }
    if (!profile && !(await saveDraft())) return;
    if (profile && !(await saveDraft())) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const endpoint = ["rejected", "action_required"].includes(profile?.status) ? "/seller/applications/resubmit" : "/seller/applications/submit";
      const { data } = await api.post(endpoint);
      setProfile(data.profile); setMessage("Application submitted for admin review.");
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  };

  if (loading) return <main className="seller-shell"><p className="seller-state">Loading your seller application...</p></main>;
  if (profile?.status === "pending") return <main className="seller-shell"><header className="seller-page-heading"><p className="seller-eyebrow">SELLER APPLICATION</p><h1>Under review.</h1><p>Your application has been submitted and is awaiting administrator review. Seller tools remain locked until approval.</p></header><section className="seller-status-panel"><span className="seller-status-icon"><FiCheck /></span><div><strong>Submitted · awaiting verification</strong><p>Submitted {new Date(profile.updatedAt).toLocaleDateString()}. Uploaded documents are awaiting review; uploading them does not mean a document has been verified.</p></div></section><Link to="/collections" className="seller-secondary-link">Continue shopping <FiArrowRight /></Link></main>;
  if (profile?.status === "approved") return <main className="seller-shell"><header className="seller-page-heading"><p className="seller-eyebrow">SELLER APPLICATION</p><h1>You&apos;re approved.</h1><p>Your customer account remains active. Seller tools are ready when you are.</p></header><Link to="/seller/dashboard" className="seller-primary-link">Open Seller Hub <FiArrowRight /></Link></main>;
  if (profile?.status === "suspended") return <main className="seller-shell"><header className="seller-page-heading"><p className="seller-eyebrow">SELLER ACCOUNT</p><h1>Seller access is paused.</h1><p>Existing product and financial records are retained. Contact BioBazaar support for review details.</p></header><section className="seller-status-panel"><strong>Review note</strong><p>{profile.reviewNotes || "No additional note was provided."}</p></section></main>;

  return <main className="seller-shell seller-application-page">
    <header className="seller-page-heading"><p className="seller-eyebrow">A MARKETPLACE BUILT ON TRUST</p><h1>{profile?.status === "rejected" ? "Application rejected." : profile?.status === "action_required" ? "Application update requested." : "Apply to sell."}</h1><p>{profile?.status === "rejected" ? "Your saved application may be updated and resubmitted under the current review policy. Seller privileges remain locked until approval." : "Tell us about you and your store. Seller privileges begin only after an administrator approves your application."}</p></header>
    <section className="seller-country-notice" aria-label="Seller registration country notice"><strong>{indiaOnly ? "Seller registration is currently available only in India." : `Seller registration country codes currently configured: ${registrationCountryNames}.`}</strong><p>{indiaOnly && "International seller registration is not available yet. "}Your registration/business country is the country where your seller account is based. Delivery destinations are a separate setting; BioBazaar has no seller delivery-destination configuration in this application, so registration in a listed country does not imply international delivery.</p></section>
    {profile?.status === "draft" && <p className="seller-draft-state" role="status">Draft · Not submitted for review</p>}
    {profile?.status === "action_required" && <section className="seller-alert" role="status"><strong>Additional information required</strong><p>{profile.reviewNotes || "Please review and update the requested application information before resubmitting."}</p><p>Your existing application and uploaded documents are retained. Update the requested details below, then resubmit this application for review.</p></section>}
    {profile?.status === "rejected" && <section className="seller-alert" role="status"><strong>Application rejected</strong><p>{profile.rejectionReason || "The administrator did not provide a rejection reason."}</p><p>You may edit this saved application and resubmit it for review. Its existing documents and review history are retained.</p></section>}
    <nav className="seller-stepper" aria-label="Application steps">{["Store", "Details", "Review"].map((label, index) => <button type="button" key={label} className={step === index ? "active" : step > index ? "complete" : ""} onClick={() => index < step && setStep(index)}><span>{step > index ? <FiCheck /> : `0${index + 1}`}</span>{label}</button>)}</nav>
    <form className="seller-form" ref={formRef} onSubmit={(event) => event.preventDefault()}>
      {step === 0 && <section className="seller-form-section"><h2>Store information</h2><div className="seller-field"><label htmlFor="seller-type">Seller type</label><select id="seller-type" value={form.sellerType} onChange={(event) => update("sellerType", event.target.value)}><option value="individual">Individual seller</option><option value="business">Registered business</option></select></div><div className="seller-field"><label htmlFor="store-name">Store name (required)</label><input id="store-name" value={form.storeName} minLength="2" maxLength="100" onChange={(event) => update("storeName", event.target.value)} placeholder="e.g. Green Valley Pantry" required /></div><div className="seller-field"><label htmlFor="store-description">What do you make or offer? (optional)</label><textarea id="store-description" rows="4" maxLength="2000" value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="Describe your products or craft" /></div><div className="seller-field-grid"><div className="seller-field"><label htmlFor="seller-email">Contact email (required)</label><input id="seller-email" type="email" value={form.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} placeholder="you@example.com" required /></div><div className="seller-field"><label htmlFor="seller-phone">Contact phone (required)</label><input id="seller-phone" type="tel" value={form.contactPhone} minLength="7" onChange={(event) => update("contactPhone", event.target.value)} placeholder="Include your area or country code" required /></div></div></section>}
      {step === 1 && <section className="seller-form-section"><h2>{form.sellerType === "business" ? "Business details" : "Individual details"}</h2>{form.sellerType === "individual" ? <div className="seller-field"><label htmlFor="legal-name">Legal name (required)</label><input id="legal-name" value={form.individual.legalName} minLength="2" onChange={(event) => updateNested("individual", "legalName", event.target.value)} placeholder="Name on your identity document" required /></div> : <><div className="seller-field"><label htmlFor="business-name">Registered legal name (required)</label><input id="business-name" value={form.business.legalName} minLength="2" onChange={(event) => updateNested("business", "legalName", event.target.value)} placeholder="Registered business name" required /></div><div className="seller-field-grid"><div className="seller-field"><label htmlFor="registration">Business registration number (required)</label><input id="registration" value={form.business.registrationNumber} minLength="2" onChange={(event) => updateNested("business", "registrationNumber", event.target.value)} placeholder="Enter the registered number" required /></div><div className="seller-field"><label htmlFor="tax-id">Tax ID (optional, if applicable)</label><input id="tax-id" value={form.business.taxId} onChange={(event) => updateNested("business", "taxId", event.target.value)} placeholder="Enter your tax ID, if applicable" /></div></div></>}
        <h3>Business or contact address</h3><div className="seller-field"><label htmlFor="address-line">Address line (required)</label><input id="address-line" value={form.address.line1} onChange={(event) => updateNested("address", "line1", event.target.value)} placeholder="Street address and building" required /></div><div className="seller-field"><label htmlFor="address-line2">Address line 2 (optional)</label><input id="address-line2" value={form.address.line2} onChange={(event) => updateNested("address", "line2", event.target.value)} placeholder="Apartment, suite, or floor" /></div><div className="seller-field-grid"><div className="seller-field"><label htmlFor="seller-city">City (required)</label><input id="seller-city" value={form.address.city} onChange={(event) => updateNested("address", "city", event.target.value)} placeholder="City or town" required /></div><div className="seller-field"><label htmlFor="seller-region">State / region (required)</label><input id="seller-region" value={form.address.region} onChange={(event) => updateNested("address", "region", event.target.value)} placeholder="State or region" required /></div></div><div className="seller-field-grid"><div className="seller-field"><label htmlFor="postal-code">Postal code (required)</label><input id="postal-code" value={form.address.postalCode} onChange={(event) => updateNested("address", "postalCode", event.target.value)} placeholder="Postal or ZIP code" required /></div><div className="seller-field"><label htmlFor="country-code">Seller registration country (required)</label><select id="country-code" value={form.address.country} onChange={(event) => updateNested("address", "country", event.target.value)} required>{registrationCountries.map((country) => <option key={country} value={country}>{countryName(country)} ({country}){indiaOnly ? " · Currently supported" : ""}</option>)}</select><small>{indiaOnly ? "India is currently the only supported seller registration country." : `Choose one of the countries configured for seller registration: ${registrationCountryNames}.`}</small></div></div>
        <section className="seller-document-panel" aria-labelledby="seller-document-title"><h3 id="seller-document-title">Identity / business verification</h3><p>Upload a document that helps reviewers confirm your seller identity or business details. Accepted formats: PDF, JPEG, PNG. Maximum 5 MB per file; up to eight files total. Files are stored privately and can be accessed by you and authorized BioBazaar reviewers.</p>
          <label className="seller-file-picker" htmlFor="verification-files"><FiUpload /> Choose verification documents</label><input id="verification-files" type="file" accept="application/pdf,image/jpeg,image/png" multiple onChange={chooseFiles} disabled={saving || files.length + (profile?.verificationDocuments?.length || 0) >= 8} /><small>PDF, JPEG, or PNG; maximum 5 MB each. Choose up to 4 files at a time, with 8 files allowed per application.</small>
          {files.length > 0 && <div className="seller-document-list"><strong>Selected · not uploaded</strong>{files.map((file, index) => <div className="seller-document-row" key={`${file.name}-${file.lastModified}-${index}`}><span>{file.name}<small>{file.type || "Unknown type"} · {formatSize(file.size)}</small></span><button type="button" className="seller-document-action" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} disabled={saving}>Remove</button></div>)}</div>}
          {uploadProgress !== null && <p className="seller-upload-progress" role="status">Uploading documents… {uploadProgress}%</p>}
          {(profile?.verificationDocuments || []).map((document) => <div className="seller-document-row" key={document.storageKey}><span>{document.originalName}<small>{document.contentType} · {formatSize(document.size)} · {profile.status === "pending" ? "Submitted · awaiting verification" : "Uploaded · awaiting application submission"}</small></span>{["draft", "rejected"].includes(profile.status) && <button type="button" className="seller-document-action" onClick={() => removeUploadedDocument(document.storageKey)} disabled={saving}>Remove</button>}</div>)}
          <p className="seller-privacy-note">Selecting a file only stages it in this form. It is marked uploaded only after Save draft or Continue succeeds. Upload does not mean the document has been verified.</p>
        </section>
      </section>}
      {step === 2 && <section className="seller-form-section seller-review"><h2>Review your application</h2><dl><div><dt>Seller type</dt><dd>{form.sellerType === "business" ? "Registered business" : "Individual seller"}</dd></div><div><dt>Store</dt><dd>{form.storeName || "Not provided"}</dd></div><div><dt>Contact</dt><dd>{form.contactEmail || "Not provided"} · {form.contactPhone || "Not provided"}</dd></div><div><dt>Legal applicant</dt><dd>{form.sellerType === "business" ? form.business.legalName : form.individual.legalName}</dd></div><div><dt>Address</dt><dd>{[form.address.line1, form.address.line2, form.address.city, form.address.region, form.address.postalCode, form.address.country].filter(Boolean).join(", ")}</dd></div><div><dt>Verification</dt><dd>{files.length ? `${files.length} new file(s) to upload` : `${profile?.verificationDocuments?.length || 0} file(s) saved`}</dd></div></dl><label className="seller-agreement"><input type="checkbox" checked={agreementAccepted} onChange={(event) => setAgreementAccepted(event.target.checked)} /><span>I accept the <a href="/seller-agreement-2026-01.html" target="_blank" rel="noreferrer">BioBazaar Seller Agreement</a>, version {agreementVersion}.</span></label><p className="seller-privacy-note">Documents are stored privately and accessible only to you and authorized reviewers. Do not upload payment card data.</p></section>}
      {step === 2 && <section className="seller-declaration"><p className="seller-eyebrow">VERSION {agreementVersion}</p><h3>Seller Declaration &amp; Agreement</h3><p className="seller-declaration-intro">Please review this declaration before accepting. The linked agreement is marked as a working draft and requires platform-owner/legal review before production use.</p><h4>Information and listings</h4><ul><li>I confirm that the identity, business, and contact information I submit is accurate and will update it if it changes.</li><li>I am responsible for the legality, safety, authenticity, and accurate descriptions of products I list. I will not make unsupported certification or environmental claims.</li></ul><h4>Seller responsibilities and review</h4><ul><li>I am responsible for product quality, inventory accuracy, fulfilment, and applicable requirements for the products and business I offer.</li><li>Submitting an application does not guarantee approval. An administrator may review, reject, or suspend seller access through BioBazaar's current application workflow.</li><li>I will protect my account credentials and am responsible for actions taken through my seller account.</li></ul><h4>Country and platform services</h4><ul><li>Seller registration is currently available for: {registrationCountryNames}. Registration country is separate from delivery destinations; delivery destinations are not configured in this application.</li><li>Checkout, commissions, fees, refunds, cancellations, seller payments, and payouts are not enabled or defined here. This declaration does not set those terms or represent that BioBazaar processes orders or payments.</li></ul><h4>Documents and personal information</h4><p>Verification documents are stored privately and accessible to the submitting account and authorized BioBazaar reviewers through authenticated routes. The application does not currently link a separate public privacy policy or document-retention schedule.</p><h4>False information and policy concerns</h4><p>False application information or policy concerns can lead to rejection or suspension under the existing review workflow. Rejection reasons are shown where provided. This declaration does not create other fee, refund, payout, or appeal terms.</p><p className="seller-draft-notice">The platform owner should approve production seller terms and publish a privacy/retention notice before treating this as a finalized legal agreement.</p><label className="seller-agreement seller-agreement-visible"><input type="checkbox" checked={agreementAccepted} onChange={(event) => setAgreementAccepted(event.target.checked)} /><span>I have read and agree to the Seller Declaration and the applicable BioBazaar seller policies (version {agreementVersion}).</span></label></section>}
      {step === 2 && <p className="seller-agreement-link"><a href="/seller-agreement-2026-01.html" target="_blank" rel="noreferrer">Read the full BioBazaar Seller Agreement working draft</a></p>}
      {error && <p className="seller-form-error" role="alert">{error}</p>}{message && <p className="seller-form-success" role="status">{message}</p>}
      <div className="seller-form-actions"><button type="button" className="seller-secondary-button" onClick={saveDraft} disabled={saving}>Save draft</button><div>{step > 0 && <button type="button" className="seller-secondary-button" onClick={() => setStep((current) => current - 1)}><FiArrowLeft /> Back</button>}{step < 2 ? <button type="button" className="seller-primary-link" onClick={nextStep} disabled={saving}>Continue <FiArrowRight /></button> : <button type="button" className="seller-primary-link" onClick={submit} disabled={saving}>{saving ? "Submitting..." : profile?.status === "rejected" ? "Resubmit application" : "Submit application"} <FiArrowRight /></button>}</div></div>
    </form>
  </main>;
}
