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
    event DistributorAssigned(uint orderId, address distributor);

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

    // Function to assign a distributor to an order
    function assignDistributor(uint _orderId, address _distributor) public {
        require(_orderId > 0 && _orderId <= orderCounter, "Order does not exist.");
        Order storage order = orders[_orderId - 1];
        require(keccak256(abi.encodePacked(order.status)) == keccak256(abi.encodePacked("Preparing for Dispatch")), "Order is not ready for dispatch.");
        order.distributor = _distributor;
        order.status = "Dispatched";
        order.orderHistory = string(abi.encodePacked(order.orderHistory, " | Assigned to distributor: ", toAsciiString(_distributor)));
        emit DistributorAssigned(_orderId, _distributor);
    }

    // Function to cancel an order
    function cancelOrder(uint _orderId) public {
        require(_orderId > 0 && _orderId <= orderCounter, "Order does not exist.");
        Order storage order = orders[_orderId - 1];
        order.status = "Canceled";
        order.orderHistory = string(abi.encodePacked(order.orderHistory, " | Order canceled due to lack of transportation"));
        emit OrderStatusUpdated(_orderId, "Canceled");
    }

    // Helper function to convert address to string
    function toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2 ** (8 * (19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2 * i] = char(hi);
            s[2 * i + 1] = char(lo);
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
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

    // Get all orders
    function getAllOrders() public view returns (Order[] memory) {
        return orders;
    }

    // Get orders by distributor
    function getOrdersByDistributor(address _distributor) public view returns (Order[] memory) {
        uint orderCount = 0;

        // Count orders assigned to the given distributor
        for (uint i = 0; i < orders.length; i++) {
            if (orders[i].distributor == _distributor) {
                orderCount++;
            }
        }

        // Create an array to store distributor orders
        Order[] memory distributorOrders = new Order[](orderCount);
        uint index = 0;

        // Populate the array with matching orders
        for (uint i = 0; i < orders.length; i++) {
            if (orders[i].distributor == _distributor) {
                distributorOrders[index] = orders[i];
                index++;
            }
        }

        return distributorOrders;
    }
}
