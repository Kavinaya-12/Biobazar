/* eslint-disable react/prop-types */
import { productCardDescription } from "../utils/productCardPresentation";
import ProductInformationCoverage from "./ProductInformationCoverage";
import "./product-card-description.css";

export default function ProductCardDescription({ product, className = "" }) {
  const description = productCardDescription(product);
  return <>
    {description && <p className={["product-card-description", className].filter(Boolean).join(" ")}>{description}</p>}
    <ProductInformationCoverage product={product} />
  </>;
}
