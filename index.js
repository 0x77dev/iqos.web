const log = (data) => {
    document.querySelector("pre").innerHTML = document.querySelector("pre").innerHTML + data + "\n";
};
const status = (data) => {
    document.querySelector("h1").innerHTML = data;
}
const onButtonClick = () => {
    // Validate services UUID entered by user first.
    let optionalServices = ["daebb240-b041-11e4-9e45-0002a5d5c51b"];
    //f8a54120-b041-11e4-9be7-0002a5d5c51b battery status characteristic

    log('Requesting any Bluetooth Device...');
    navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: optionalServices
    })
        .then(device => {
            log('Connecting to GATT Server...');
            return device.gatt.connect();
        })
        .then(server => {
            log('Getting Services...');
            return server.getPrimaryServices();
        })
        .then(services => {
            log('Getting Characteristics...');
            let queue = Promise.resolve();
            services.forEach(service => {
                queue = queue.then(_ => service.getCharacteristics().then(characteristics => {
                    log('> Service: ' + service.uuid);
                    characteristics.forEach(characteristic => {
                        // log('> C: ', characteristic.uuid.uuid);
                        console.log(characteristic.uuid);
                        if (characteristic.uuid == "f8a54120-b041-11e4-9be7-0002a5d5c51b") {
                            log("characteristic of battery found");
                            status("Battery found");
                            characteristic.startNotifications().then(characteristic => {
                                characteristic.addEventListener(
                                    'characteristicvaluechanged', handleCharacteristicValueChanged
                                );

                            })
                                .catch(error => { console.log(error); });

                        }
                        log("Reinsert holder to begin...");
                    });
                }));
            });
            return queue;
        })
        .catch(error => {
            log('Argh! ' + error);
            setTimeout(() => { location.href = location.href; }, 5000)
        });
}

const handleCharacteristicValueChanged = (event) => {
    var value = event.target.value;
    console.log(value);
    var batteryValue = new Uint8Array(value.buffer.slice(-1))[0];
    if (value.buffer.byteLength == 7) {
        log("[BATTERY] " + batteryValue + "%");
        if (batteryValue == 0) {
            status("Charging");
        } else {
            status("Charged: " + batteryValue + "%");
        }
    } else {
        log("[IQOS] " + "Holder not on charge");
        status("Holder not on charge");
    }
}
const getSupportedProperties = (characteristic) => {
    let supportedProperties = [];
    for (const p in characteristic.properties) {
        if (characteristic.properties[p] === true) {
            supportedProperties.push(p.toUpperCase());
        }
    }
    return '[' + supportedProperties.join(', ') + ']';
}