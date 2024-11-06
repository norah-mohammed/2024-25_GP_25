// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRoleContract {
    function checkManufacturer(address _address) external view returns (bool);
}

contract ProductContract {
    enum TransportMode { Refrigerated, Frozen, Ambient }

    struct Product {
        uint productId;
        string name;
        string description;
        int maxTemp;
        int minTemp;
        uint weight;
        uint price;
        uint itemsPerPack; // Number of items per pack
        address manufacturer;  // Ethereum address of the manufacturer
        string status;  // Product status (e.g., "In Stock", "Out of Stock")
        TransportMode transportMode; // Transport mode
    }

    Product[] public products;
    uint public productCounter = 0;
    IRoleContract public roleContract;  // Interface to the RoleContract

    event ProductAdded(uint productId, string name, address manufacturer);

    constructor(address _roleContractAddress) {
        roleContract = IRoleContract(_roleContractAddress);
    }

    // Add a new product
    function addProduct(
        string memory _name,
        string memory _description,
        uint _weight,
        uint _price,
        uint _itemsPerPack,
        TransportMode _transportMode
    ) public {
        require(roleContract.checkManufacturer(msg.sender), "Only registered manufacturers can add products.");

        (int _maxTemp, int _minTemp) = getTemperatureRange(_transportMode);

        productCounter++;
        products.push(Product(
            productCounter,
            _name,
            _description,
            _maxTemp,
            _minTemp,
            _weight,
            _price,
            _itemsPerPack,
            msg.sender,
            "In Stock",
            _transportMode
        ));

        emit ProductAdded(productCounter, _name, msg.sender);
    }

    // Helper function to get temperature range based on TransportMode
    function getTemperatureRange(TransportMode mode) internal pure returns (int, int) {
        if (mode == TransportMode.Frozen) {
            return (-15, -25);  // Min and Max temperatures for Frozen in Celsius
        } else if (mode == TransportMode.Refrigerated) {
            return (4, 0);  // Min and Max temperatures for Refrigerated in Celsius
        } else if (mode == TransportMode.Ambient) {
            return (25, 15);  // Min and Max temperatures for Ambient in Celsius
        } else {
            revert("Invalid transport mode");
        }
    }

    // Get all products by manufacturer
    function getProductsByManufacturer(address _manufacturer) public view returns (Product[] memory) {
        uint productCount = 0;
        for (uint i = 0; i < products.length; i++) {
            if (products[i].manufacturer == _manufacturer) {
                productCount++;
            }
        }
        Product[] memory manufacturerProducts = new Product[](productCount);
        uint index = 0;
        for (uint i = 0; i < products.length; i++) {
            if (products[i].manufacturer == _manufacturer) {
                manufacturerProducts[index] = products[i];
                index++;
            }
        }
        return manufacturerProducts;
    }

    // Get product by product ID
    function getProductById(uint _productId) public view returns (Product memory) {
        require(_productId > 0 && _productId <= productCounter, "Product does not exist.");
        return products[_productId - 1];
    }
}
