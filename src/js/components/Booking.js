import {
    templates,
    select,
    settings,
    classNames
} from "../settings.js";
import AmountWidget from "./AmountWidget.js";
import DatePicker from "./DatePicker.js";
import HourPicker from "./HourPicker.js";
import {
    utils
} from "../utils.js";



class Booking {
    constructor(element) {
        const thisBooking = this;

        thisBooking.render(element);
        thisBooking.initWidgets();
        thisBooking.getData();
    }

    getData() {
        const thisBooking = this;

        const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
        const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

        const params = {
            booking: [
                startDateParam,
                endDateParam
            ],
            eventsCurrent: [
                settings.db.notRepeatParam,
                startDateParam,
                endDateParam
            ],
            eventsRepeat: [
                settings.db.repeatParam,
                endDateParam
            ]
        };

        const urls = {
            booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking.join('&'),
            eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent.join('&'),
            eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat.join('&')
        };

        Promise.all([
                fetch(urls.booking),
                fetch(urls.eventsCurrent),
                fetch(urls.eventsRepeat),
            ])
            .then(function (allResponses) {
                const bookingResponse = allResponses[0];
                const eventsCurrentResponse = allResponses[1];
                const eventsRepeatResponse = allResponses[2];

                return Promise.all([
                    bookingResponse.json(),
                    eventsCurrentResponse.json(),
                    eventsRepeatResponse.json()
                ]);
            })
            .then(function ([bookings, eventsCurrent, eventsRepeat]) {
                thisBooking.parseData([bookings, eventsCurrent, eventsRepeat]);
            });
    }

    parseData([bookings, eventsCurrent, eventsRepeat]) {
        const thisBooking = this;

        thisBooking.booked = {};

        for (let item of eventsCurrent) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }
        for (let item of bookings) {
            thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
        }

        const minDate = thisBooking.datePicker.minDate;
        const maxDate = thisBooking.datePicker.maxDate;

        for (let item of eventsRepeat) {
            if (item.repeat == 'daily') {
                for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
                    thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
                }
            }
        }
        thisBooking.updateDOM();
    }

    makeBooked(date, hour, duration, table) {
        const thisBooking = this;

        const startHour = utils.hourToNumber(hour);

        if (typeof thisBooking.booked[date] == 'undefined') {
            thisBooking.booked[date] = {};
        }

        for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
            if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
                thisBooking.booked[date][hourBlock] = [];
            }
            thisBooking.booked[date][hourBlock].push(table);
        }
    }

    updateDOM() {
        const thisBooking = this;

        thisBooking.date = thisBooking.datePicker.value;
        thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

        let allAvailable = false;

        if (typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
            typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined') {
            allAvailable = true;
        }

        for (let table of thisBooking.dom.tables) {
            let tableId = table.getAttribute(settings.booking.tableIdAttribute);
            if (!isNaN(tableId)) {
                tableId = parseInt(tableId);
            }

            if (
                !allAvailable &&
                thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
            ) {
                table.classList.add(classNames.booking.tableBooked);
            } else {
                table.classList.remove(classNames.booking.tableBooked);
            }
        }
    }

    selectTable(event) {
        const thisBooking = this;

        const clickedTable = event.target;
        const isThisTable = clickedTable.classList.contains('table');
        const isAlreadyBooked = clickedTable.classList.contains('booked');
        const tableId = clickedTable.getAttribute(settings.booking.tableIdAttribute);
        const selectedTable = clickedTable.classList.contains('selected');
        if (isThisTable) {
            if (isAlreadyBooked) {
                alert('Stolik zaj??ty!');
            } else if (selectedTable) {
                for (let table of thisBooking.dom.tables) {
                    table.classList.remove('selected');
                }
                thisBooking.chosenTable = null;
            } else {
                for (let table of thisBooking.dom.tables) {
                    table.classList.remove('selected');
                }
                clickedTable.classList.add('selected');
                thisBooking.chosenTable = tableId;
            }
        }
        thisBooking.getData();
    }


    sendBooking() {
        const thisBooking = this;

        const url = settings.db.url + '/' + settings.db.booking;

        const payload = {
            date: thisBooking.date,
            hour: utils.numberToHour(thisBooking.hour),
            duration: parseInt(thisBooking.dom.hoursInput.value),
            table: parseInt(thisBooking.chosenTable),
            ppl: parseInt(thisBooking.dom.amountInput.value),
            starters: [],
            phone: thisBooking.dom.submitPhone.value,
            address: thisBooking.dom.submitAdress.value
        };

        const starters = document.querySelectorAll('.checkbox input[name="starter"]');

        for (let starter of starters) {
            if (starter.checked) {
                payload.starters.unshift(starter.value);
            }
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };

        if (thisBooking.dom.submitPhone.value.length && thisBooking.dom.submitAdress.value.length && thisBooking.chosenTable) {
            fetch(url, options).then(function () {
                window.alert('Dzi??kuj??my za z??o??enie zam??wenia :)');
            });
        } else {
            window.alert('Uzupe??nij wszystkie pola i wybierz stolik!');
        }
    }

    render(element) {
        const thisBooking = this;

        const generatedHTML = templates.bookingWidget();

        thisBooking.dom = {};

        thisBooking.dom.wrapper = element;
        thisBooking.dom.wrapper.innerHTML = generatedHTML;
        thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
        thisBooking.dom.amountInput = thisBooking.dom.wrapper.querySelector(select.booking.amountInput);
        thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
        thisBooking.dom.hoursInput = thisBooking.dom.wrapper.querySelector(select.booking.hoursInput);
        thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
        thisBooking.dom.datePickerInput = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.input);
        thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
        thisBooking.dom.hourPickerInput = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.input);
        thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
        thisBooking.dom.tablesDiv = thisBooking.dom.wrapper.querySelector(select.booking.tableDiv);
        thisBooking.dom.submitForm = thisBooking.dom.wrapper.querySelector(select.booking.formSubmit);
        thisBooking.dom.submitPhone = thisBooking.dom.wrapper.querySelector(select.booking.formPhone);
        thisBooking.dom.submitAdress = thisBooking.dom.wrapper.querySelector(select.booking.formAdress);
    }

    initWidgets() {
        const thisBooking = this;

        thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
        thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

        thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
        thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

        thisBooking.dom.wrapper.addEventListener('updated', function () {
            thisBooking.updateDOM();
        });
        thisBooking.dom.tablesDiv.addEventListener('click', function (event) {
            thisBooking.selectTable(event);
        });
        thisBooking.dom.submitForm.addEventListener('submit', function (event) {
            event.preventDefault();
            thisBooking.sendBooking(event);
        });
        thisBooking.dom.datePickerInput.addEventListener('change', function () {
            for (let table of thisBooking.dom.tables) {
                table.classList.remove('selected');
                thisBooking.chosenTable = null;
            }
        });
        thisBooking.dom.hourPickerInput.addEventListener('change', function () {
            for (let table of thisBooking.dom.tables) {
                table.classList.remove('selected');
                thisBooking.chosenTable = null;
            }
        });


    }
}


export default Booking;