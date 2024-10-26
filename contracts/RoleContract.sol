// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RoleContract {

    struct Retailer {
        address ethAddress;
        string name;
        string physicalAddress;
        string phoneNumber;
        string email;
    }

    struct Manufacturer {
        address ethAddress;
        string name;
        string addressLine;
        string phoneNumber;
        string email;
    }

    mapping(address => Manufacturer) public manufacturers;
    address[] public manufacturerAddresses;
    mapping(address => bool) public isManufacturer;

    // Event when a manufacturer is added
    event ManufacturerAdded(address indexed manufacturerAddress, string name);

    // Function to add a manufacturer
    function addManufacturer(
        address _manufacturerAddress,
        string memory _name,
        string memory _addressLine,
        string memory _phoneNumber,
        string memory _email
    ) public {
        // Ensure the manufacturer is not already added
        require(manufacturers[_manufacturerAddress].ethAddress == address(0), "Manufacturer already exists.");
        
        // Create and store the new manufacturer
        manufacturers[_manufacturerAddress] = Manufacturer(_manufacturerAddress, _name, _addressLine, _phoneNumber, _email);
        manufacturerAddresses.push(_manufacturerAddress);
        isManufacturer[_manufacturerAddress] = true; // Track this as a manufacturer

        // Emit the event
        emit ManufacturerAdded(_manufacturerAddress, _name);
    }

    // Function to return all manufacturers' addresses
    function getAllManufacturers() public view returns (address[] memory) {
        return manufacturerAddresses;
    }

    // Function to get the details of a specific manufacturer by address
    function getManufacturerDetails(address _manufacturer) public view returns (
        string memory name, 
        string memory addressLine, 
        string memory phoneNumber, 
        string memory email
    ) {
        Manufacturer memory m = manufacturers[_manufacturer];
        require(m.ethAddress != address(0), "Manufacturer does not exist.");

        return (m.name, m.addressLine, m.phoneNumber, m.email);
    }

    // Function to check if an address is a registered manufacturer
    function checkManufacturer(address _address) public view returns (bool) {
        return isManufacturer[_address];
    }


    // Update Manufacturer Info
    function updateManufacturer(
        address _ethAddress,
        string memory _name,
        string memory _physicalAddress,
        string memory _phoneNumber,
        string memory _email
    ) public {
        require(manufacturers[_ethAddress].ethAddress != address(0), "Manufacturer does not exist");
        Manufacturer storage m = manufacturers[_ethAddress];
        m.name = _name;
        m.addressLine = _physicalAddress;
        m.phoneNumber = _phoneNumber;
        m.email = _email;
        emit ManufacturerUpdated(_ethAddress);
    }

 // Get manufacturer details
    function getManufacturer(address _manufacturer) public view returns (Manufacturer memory) {
        Manufacturer memory m = manufacturers[_manufacturer];
        require(m.ethAddress != address(0), "Manufacturer does not exist");  // Check if the manufacturer exists
        return m;
    }



    struct Distributor {
        address ethAddress;
        string name;
        string physicalAddress;
        string phoneNumber;
        string email;
        bool isRefrigerated;
        bool isFrozen;
        bool isAmbient;
        bool isPM;
        bool isAM;
        bool[7] workingDays; // Array to represent working days, 7 booleans for each day of the week
    }

    address public retailerAddress; // Only one retailer allowed
    
    mapping(address => Distributor) public distributors;
    Retailer public retailer;

    event RetailerAdded(address retailer);
    event ManufacturerAdded(address manufacturer);
    event DistributorAdded(address distributor);
    event RetailerUpdated(address retailer);
    event ManufacturerUpdated(address manufacturer);
    event DistributorUpdated(address distributor);

    // Function to add a retailer (only one retailer allowed)
    function addRetailer(
        address _ethAddress,
        string memory _name,
        string memory _physicalAddress,
        string memory _phoneNumber,
        string memory _email
    ) public {
        require(retailerAddress == address(0), "Retailer already added");
        retailer = Retailer(_ethAddress, _name, _physicalAddress, _phoneNumber, _email);
        retailerAddress = _ethAddress;
        emit RetailerAdded(_ethAddress);
    }
    
     function checkRetailer(address _address) public view returns (bool) {
    return _address == retailer.ethAddress;  // Compare with the registered retailer's address
}


  

    // Update Retailer Info
    function updateRetailer(
        string memory _name,
        string memory _physicalAddress,
        string memory _phoneNumber,
        string memory _email
    ) public {
        require(retailerAddress != address(0), "No retailer registered");
        retailer.name = _name;
        retailer.physicalAddress = _physicalAddress;
        retailer.phoneNumber = _phoneNumber;
        retailer.email = _email;
        emit RetailerUpdated(retailerAddress);
    }

  

    // Function to add a distributor
    function addDistributor(
        address _ethAddress,
        string memory _name,
        string memory _physicalAddress,
        string memory _phoneNumber,
        string memory _email,
        bool _isRefrigerated,
        bool _isFrozen,
        bool _isAmbient,
        bool _isPM,
        bool _isAM,
        bool[7] memory _workingDays
    ) public {
        distributors[_ethAddress] = Distributor(
            _ethAddress, 
            _name, 
            _physicalAddress, 
            _phoneNumber, 
            _email, 
            _isRefrigerated, 
            _isFrozen, 
            _isAmbient, 
            _isPM, 
            _isAM,
            _workingDays
        );
        emit DistributorAdded(_ethAddress);
    }

    // Update Distributor Info
    function updateDistributor(
        address _ethAddress,
        string memory _name,
        string memory _physicalAddress,
        string memory _phoneNumber,
        string memory _email,
        bool _isRefrigerated,
        bool _isFrozen,
        bool _isAmbient,
        bool _isPM,
        bool _isAM,
        bool[7] memory _workingDays
    ) public {
        require(distributors[_ethAddress].ethAddress != address(0), "Distributor does not exist");
        Distributor storage d = distributors[_ethAddress];
        d.name = _name;
        d.physicalAddress = _physicalAddress;
        d.phoneNumber = _phoneNumber;
        d.email = _email;
        d.isRefrigerated = _isRefrigerated;
        d.isFrozen = _isFrozen;
        d.isAmbient = _isAmbient;
        d.isPM = _isPM;
        d.isAM = _isAM;
        d.workingDays = _workingDays;
        emit DistributorUpdated(_ethAddress);
    }

    // Function to get retailer details
    function getRetailer() public view returns (
        address ethAddress,
        string memory name,
        string memory physicalAddress,
        string memory phoneNumber,
        string memory email
    ) {
        require(retailerAddress != address(0), "No retailer registered");
        return (retailer.ethAddress, retailer.name, retailer.physicalAddress, retailer.phoneNumber, retailer.email);
    }

   

    // Function to get distributor details
    function getDistributor(address _distributor) public view returns (
        address ethAddress,
        string memory name,
        string memory physicalAddress,
        string memory phoneNumber,
        string memory email,
        bool isRefrigerated,
        bool isFrozen,
        bool isAmbient,
        bool isPM,
        bool isAM,
        bool[7] memory workingDays
    ) {
        Distributor memory d = distributors[_distributor];
        require(d.ethAddress != address(0), "Distributor does not exist");
        return (
            d.ethAddress, 
            d.name, 
            d.physicalAddress, 
            d.phoneNumber, 
            d.email, 
            d.isRefrigerated, 
            d.isFrozen, 
            d.isAmbient, 
            d.isPM, 
            d.isAM,
            d.workingDays
        );
    }
}
