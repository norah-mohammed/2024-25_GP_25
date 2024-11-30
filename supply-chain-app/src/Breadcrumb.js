import React from "react";
import "./Breadcrumb.css";

const Breadcrumb = ({ currentPage, setCurrentPage }) => {
  // Define breadcrumb structure
  const pagePaths = {
    nonUserPage: ["Home"], // Home represents nonUserPage
    manufacturerHomePage: ["Home", "Dashboard"],
    ordersPage: ["Home", "Orders"],
    manufacturerDistributorsPage: ["Home", "Distributors"],
    retailerHomePage: ["Home", "Dashboard"],
    viewManufacturers: ["Home", "View Manufacturers"],
    distributorHomePage: ["Home", "Dashboard"],
    distributorOrdersPage: ["Home", "Orders"],
  };

  // Hide breadcrumb for AddProduct page
  if (currentPage === "AddProduct") {
    return null;
  }

  // Resolve current path from pagePaths
  const currentPath = pagePaths[currentPage];

  // Return null if the page is not found
  if (!currentPath) {
    return null; // Hide the breadcrumb
  }

  // Handle click to navigate
  const handleBreadcrumbClick = (index) => {
    if (!setCurrentPage) return; // Prevent errors if setCurrentPage is not provided

    // Map the clicked breadcrumb segment back to a page in pagePaths
    const newPage = Object.keys(pagePaths).find((key) => {
      return pagePaths[key].slice(0, index + 1).join(">") === currentPath.slice(0, index + 1).join(">");
    });

    if (newPage) {
      setCurrentPage(newPage); // Update the current page
    }
  };

  return (
    <div className="breadcrumb">
      {currentPath.map((label, index) => (
        <span key={index} className="breadcrumb-item">
          {setCurrentPage && index < currentPath.length - 1 ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleBreadcrumbClick(index);
              }}
            >
              {label}
            </a>
          ) : (
            <span>{label}</span>
          )}
          {index < currentPath.length - 1 && " > "}
        </span>
      ))}
    </div>
  );
};

export default Breadcrumb;
