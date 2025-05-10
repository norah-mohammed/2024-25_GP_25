// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRoleContract {
    function checkManufacturer(address _address) external view returns (bool);
}

contract ProductContract {
    enum TransportMode { Refrigerated, Frozen, Ambient }

    struct ProductDetails {
        uint weight;
        uint price;
        uint itemsPerPack;
        TransportMode transportMode;
        uint256 minOrderQuantity;
        uint256 maxOrderQuantity;
    }

    struct Product {
        uint productId;
        string name;
        string description;
        int maxTemp;
        int minTemp;
        ProductDetails details;
        address manufacturer;
        string status;
    }

    struct NewProductInput {
        string name;
        string description;
        ProductDetails details;
    }

    struct TemperatureRange {
        int maxTemp;
        int minTemp;
    }

    mapping(uint => Product) public products;
    uint public productCounter = 0;
    IRoleContract public roleContract;

    event ProductAdded(uint productId, string name, address manufacturer);

    constructor(address _roleContractAddress) {
        roleContract = IRoleContract(_roleContractAddress);
    }

    function addProduct(NewProductInput memory input) public {
        require(roleContract.checkManufacturer(msg.sender), "Only registered manufacturers can add products.");

        TemperatureRange memory tempRange = getTemperatureRange(input.details.transportMode);

        productCounter++;

        products[productCounter].productId = productCounter;
        products[productCounter].name = input.name;
        products[productCounter].description = input.description;
        products[productCounter].maxTemp = tempRange.maxTemp;
        products[productCounter].minTemp = tempRange.minTemp;
        products[productCounter].details = input.details;
        products[productCounter].manufacturer = msg.sender;
        products[productCounter].status = "In Stock";

        emit ProductAdded(productCounter, input.name, msg.sender);
    }

    function getTemperatureRange(TransportMode mode) internal pure returns (TemperatureRange memory) {
        if (mode == TransportMode.Frozen) {
            return TemperatureRange(-15, -25);
        } else if (mode == TransportMode.Refrigerated) {
            return TemperatureRange(4, 0);
        } else if (mode == TransportMode.Ambient) {
            return TemperatureRange(25, 15);
        } else {
            revert("Invalid transport mode");
        }
    }

    function getProductsByManufacturer(address _manufacturer) public view returns (Product[] memory) {
        uint count = 0;
        for (uint i = 1; i <= productCounter; i++) {
            if (products[i].manufacturer == _manufacturer) {
                count++;
            }
        }

        Product[] memory result = new Product[](count);
        uint index = 0;
        for (uint i = 1; i <= productCounter; i++) {
            if (products[i].manufacturer == _manufacturer) {
                result[index] = products[i];
                index++;
            }
        }

        return result;
    }

    function getProductById(uint _productId) public view returns (Product memory) {
        require(_productId > 0 && _productId <= productCounter, "Product does not exist.");
        return products[_productId];
    }

    function updateProductStatus(uint _productId, string memory _newStatus) public {
        require(_productId > 0 && _productId <= productCounter, "Product does not exist.");
        require(products[_productId].manufacturer == msg.sender, "Only the manufacturer can update the status.");
        require(bytes(_newStatus).length > 0, "Status cannot be empty.");

        products[_productId].status = _newStatus;
    }
}
