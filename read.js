const fs = require('fs');
const { SerialPort } = require('serialport');  // Correct import for SerialPort class

// Open the serial port where the ESP32 is connected (use the correct COM port or path)
const port = new SerialPort({ path: 'COM3', baudRate: 115200 });  // Use correct port (COM3 is just an example)

port.on('open', () => {
  console.log('Serial Port Opened');
});

port.on('data', (data) => {
  const temperature = data.toString().trim();  // Parse the temperature data from serial
  console.log(`Temperature: ${temperature}`);

  // Write the temperature to temperature.txt file
  fs.writeFileSync('temperature.txt', temperature);
});
