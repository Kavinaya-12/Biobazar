import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import ProductImage from "./ProductImage";
import "./profile.css";
import { api } from "../api";

const Profile = () => {
  const reduxUserId = useSelector((state) => state.auth.userId);
  const reduxEmail = useSelector((state) => state.auth.email);
  const { userId: routeUserId } = useParams();
  const userId = routeUserId || reduxUserId;
  const userEmail = reduxEmail || localStorage.getItem("userEmail") || "";

  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    location: "",
    profilePicture: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const buildFormData = (profile) => ({
    fullName: profile.fullName || "",
    bio: profile.bio || "",
    location: profile.location || "",
    profilePicture: profile.profilePicture || "",
  });

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/profile/${userId}`);
      if (res.data.success) {
        setProfileData(res.data.profile);
        setFormData(buildFormData(res.data.profile));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/profile/${userId}`, formData);
      if (res.data.success) {
        setProfileData(res.data.profile);
        setFormData(buildFormData(res.data.profile));
        setIsEditing(false);
        toast.success("Profile Updated Successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData(buildFormData(profileData));
    }
    setIsEditing(false);
  };

  if (loading)
    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;
  if (!profileData)
    return <main className="profile-container"><div className="profile-content profile-message"><p className="account-eyebrow">YOUR BIOBAZAAR ACCOUNT</p><h1>Profile not found</h1><p>We couldn&apos;t find profile details for this account.</p><Link className="account-link" to="/collections">Return to Shop All</Link></div></main>;
  return (
    <div className="profile-container">
      <div className="profile-breadcrumb"><Link to="/collections">Shop all</Link><span>/</span><span>Profile</span></div>
      <div className="profile-content">
        <p className="account-eyebrow">YOUR BIOBAZAAR ACCOUNT</p>
        <h1>{profileData.fullName || "Your profile"}</h1>
        <ProductImage
          src={profileData.profilePicture || "https://cdn3.iconfinder.com/data/icons/avatars-flat/33/woman_9-512.png"}
          alt="Profile picture"
          frameClassName="product-image-frame--avatar"
        />
        <p>
          <strong>Email :</strong> {userEmail}
        </p>
        <p>
          <strong>Bio :</strong> {profileData.bio}
        </p>
        <p>
          <strong>Location :</strong> {profileData.location}
        </p>
        {!isEditing ? (
          <button
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        ) : (
          <>
<label>
              Full Name (optional)
              <input
                name="fullName"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={handleChange}
              />

            </label>

            <label>

              Bio (optional)

              <input
                name="bio"
                placeholder="A short introduction (optional)"
                value={formData.bio}
                onChange={handleChange}
              />

            </label>

            <label>

              Location (optional)

              <input
                name="location"
                placeholder="City or region (optional)"
                value={formData.location}
                onChange={handleChange}
              />

            </label>

            <label>

              Profile Picture URL (optional)

              <input
                name="profilePicture"
                placeholder="https://example.com/profile.jpg"
                value={formData.profilePicture || ""}
                onChange={handleChange}
              />

            </label>

            <br />

            <button
              className="edit-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              className="edit-button"
              onClick={handleCancel}
            >
              Cancel
            </button>

          </>

        )}

        <Link className="account-link" to="/collections">Continue exploring <span aria-hidden="true">→</span></Link>
      </div>

    </div>
  );
};

export default Profile;