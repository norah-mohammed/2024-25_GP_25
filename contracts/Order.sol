// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OrderContract {
    struct Order {
        uint orderId;
        address retailer;
        address manufacturer;
        uint productId;
        uint quantity;
        uint price; // Total price of the order (product price * quantity)
        DeliveryInfo deliveryInfo; // Struct for delivery-related info
        string status;
        address distributor;
        uint temperature;
        string orderHistory;
    }

    struct DeliveryInfo {
        string deliveryDate;
        string deliveryTime;
        string shippingAddress;
    }

    Order[] public orders;
    uint public orderCounter = 0;

    event OrderStatusUpdated(uint orderId, string newStatus);

    // Function to create a new order
    function createOrder(
        uint _productId,
        uint _quantity,
        address _manufacturer,
        string memory _deliveryDate,
        string memory _deliveryTime,
        string memory _shippingAddress,
        uint _productPrice // This will be fetched from the product contract
    ) public {
        orderCounter++;
        uint totalPrice = _productPrice * _quantity;

        DeliveryInfo memory delivery = DeliveryInfo({
            deliveryDate: _deliveryDate,
            deliveryTime: _deliveryTime,
            shippingAddress: _shippingAddress
        });

          orders.push(Order({
            orderId: orderCounter,
            retailer: msg.sender,
            manufacturer: _manufacturer,
            productId: _productId,
            quantity: _quantity,
            price: totalPrice,
            deliveryInfo: delivery,
            status: "Waiting for manufacturer acceptance",  // Set initial status
            distributor: address(0), // Default value for distributor
            temperature: 0, // Default value for temperature
            orderHistory: "Order created and status set to waiting for manufacturer acceptance"
        }));

        emit OrderStatusUpdated(orderCounter, "Waiting for manufacturer acceptance");
    }

    // Function to update the order status
    function updateOrderStatus(uint _orderId, string memory _newStatus) public {
        require(_orderId > 0 && _orderId <= orderCounter, "Order does not exist.");
        Order storage order = orders[_orderId - 1];

        // Update order status logic based on role (manufacturer, retailer, etc.) here
        // For simplicity, we assume that the sender is allowed to change the status
        order.status = _newStatus;
        order.orderHistory = string(abi.encodePacked(order.orderHistory, " | Status updated to ", _newStatus));

        emit OrderStatusUpdated(_orderId, _newStatus);
    }

    // Function to get all order IDs
    function getAllOrderIds() public view returns (uint[] memory) {
        uint[] memory orderIds = new uint[](orders.length);
        for (uint i = 0; i < orders.length; i++) {
            orderIds[i] = orders[i].orderId;
        }
        return orderIds;
    }

    // Function to get retailer addresses for all orders
    function getAllRetailerAddresses() public view returns (address[] memory) {
        address[] memory retailerAddresses = new address[](orders.length);
        for (uint i = 0; i < orders.length; i++) {
            retailerAddresses[i] = orders[i].retailer;
        }
        return retailerAddresses;
    }

    // Function to get product IDs for all orders
    function getAllProductIds() public view returns (uint[] memory) {
        uint[] memory productIds = new uint[](orders.length);
        for (uint i = 0; i < orders.length; i++) {
            productIds[i] = orders[i].productId;
        }
        return productIds;
    }

    // Function to get quantities for all orders
    function getAllQuantities() public view returns (uint[] memory) {
        uint[] memory quantities = new uint[](orders.length);
        for (uint i = 0; i < orders.length; i++) {
            quantities[i] = orders[i].quantity;
        }
        return quantities;
    }

    // Function to get delivery dates for all orders
    function getAllDeliveryDates() public view returns (string[] memory) {
        string[] memory deliveryDates = new string[](orders.length);
        for (uint i = 0; i < orders.length; i++) {
            deliveryDates[i] = orders[i].deliveryInfo.deliveryDate;
        }
        return deliveryDates;
    }

    // Function to get statuses for all orders
    function getAllStatuses() public view returns (string[] memory) {
        string[] memory statuses = new string[](orders.length);
        for (uint i = 0; i < orders.length; i++) {
            statuses[i] = orders[i].status;
        }
        return statuses;
    }

    // Function to get all orders
    function getAllOrders() public view returns (Order[] memory) {
        return orders;
    }

    // Get order by ID
    function getOrderById(uint _orderId) public view returns (Order memory) {
        require(_orderId > 0 && _orderId <= orderCounter, "Order does not exist.");
        return orders[_orderId - 1];
    }

    // Get orders by distributor
    function getOrdersByDistributor(address _distributor) public view returns (Order[] memory) {
        uint orderCount = 0;

        // First count how many orders this distributor has
        for (uint i = 0; i < orders.length; i++) {
            if (orders[i].distributor == _distributor) {
                orderCount++;
            }
        }

        // Create an array to store the orders
        Order[] memory distributorOrders = new Order[](orderCount);
        uint index = 0;

        // Add each order to the array
        for (uint i = 0; i < orders.length; i++) {
            if (orders[i].distributor == _distributor) {
                distributorOrders[index] = orders[i];
                index++;
            }
        }

        return distributorOrders;
    }

    // Get orders by manufacturer
    function getOrdersByManufacturer(address _manufacturer) public view returns (Order[] memory) {
        uint orderCount = 0;
        for (uint i = 0; i < orders.length; i++) {
            if (orders[i].manufacturer == _manufacturer) {
                orderCount++;
            }
        }
        Order[] memory manufacturerOrders = new Order[](orderCount);
        uint index = 0;
        for (uint i = 0; i < orders.length; i++) {
            if (orders[i].manufacturer == _manufacturer) {
                manufacturerOrders[index] = orders[i];
                index++;
            }
        }
        return manufacturerOrders;
    }
}
