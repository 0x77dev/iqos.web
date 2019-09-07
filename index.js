Notification.requestPermission();
const notifyMe = (data, params) => {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support system notifications");
        // This is not how you would really do things if they aren't supported. :)
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        var notification = new Notification(data, params);
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {

    }

    // Finally, if the user has denied notifications and you 
    // want to be respectful there is no need to bother them any more.
}
const log = (data) => {
    const logtHistory = document.querySelector("pre");
    logtHistory.innerHTML = logtHistory.innerHTML + data + "\n";
    logtHistory.scrollTop = logtHistory.scrollHeight;
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
            notifyMe("iQOS", {
                icon: 'https://cdn.imgbin.com/0/2/4/imgbin-iqos-heat-not-burn-tobacco-product-logo-philip-morris-international-iqos-xqwK6yJ1uaiyXB71sHZz7Cus6.jpg',
                body: 'holder charged',
            });

        }
    } else {
        log("[IQOS] " + "Holder not on charge");
        status("Holder not on charge");
        notifyMe("iQOS", {
            icon: 'https://cdn.imgbin.com/0/2/4/imgbin-iqos-heat-not-burn-tobacco-product-logo-philip-morris-international-iqos-xqwK6yJ1uaiyXB71sHZz7Cus6.jpg',
            body: 'holder not on charge',
        });
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