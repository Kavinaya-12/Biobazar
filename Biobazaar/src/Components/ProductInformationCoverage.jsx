/* eslint-disable react/prop-types */
import { getProductInformationCoverage } from "../utils/productInformationCoverage";
import "./product-card-description.css";

export default function ProductInformationCoverage({ product }) {
  const coverage = getProductInformationCoverage(product);
  return (
    <details className="product-information-coverage">
      <summary>Information coverage · {coverage.completedCount} of {coverage.total} details</summary>
      <ul>
        {coverage.details.map((detail) => (
          <li key={detail.key} className={`coverage-${detail.status}`}>
            <strong>{detail.label}:</strong> {detail.status === "complete" ? detail.value : detail.status === "invalid" ? "Placeholder entered; provide a real disclosure." : "Not provided."}
          </li>
        ))}
      </ul>
      <small>Counts populated listing details only; it does not verify claims or measure product impact.</small>
    </details>
  );
}
