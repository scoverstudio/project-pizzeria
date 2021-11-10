import {
    select,
    classNames,
    templates,
    settings
} from "../settings.js";
import {
    utils
} from "../utils.js";
import CartProduct from "./CartProduct.js";

class Cart {
    constructor(element) {
        const thisCart = this;

        thisCart.products = [];

        thisCart.getElements(element);
        thisCart.initActions();
    }

    getElements(element) {
        const thisCart = this;

        thisCart.dom = {};

        thisCart.dom.wrapper = element;
        thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
        thisCart.dom.productList = thisCart.dom.wrapper.querySelector(select.cart.productList);
        thisCart.dom.productListEach = thisCart.dom.wrapper.querySelector('ul li');
        thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(select.cart.deliveryFee);
        thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(select.cart.subtotalPrice);
        thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelector(select.cart.totalPrice);
        thisCart.dom.totalPriceHeader = thisCart.dom.wrapper.querySelector(select.cart.totalPriceHeader);
        thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(select.cart.totalNumber);
        thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
        thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
        thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);
    }

    initActions() {
        const thisCart = this;
        thisCart.dom.toggleTrigger.addEventListener("click", function () {
            thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
        });
        thisCart.dom.productList.addEventListener('updated', function () {
            thisCart.update();
        });
        thisCart.dom.productList.addEventListener('remove', function (event) {
            thisCart.remove(event.detail.cartProduct);
        });
        thisCart.dom.form.addEventListener('submit', function (event) {
            event.preventDefault();
            thisCart.sendOrder();
        });

    }

    add(menuProduct) {
        const thisCart = this;

        const generatedHTML = templates.cartProduct(menuProduct);

        const generatedDOM = utils.createDOMFromHTML(generatedHTML);

        thisCart.dom.productList.appendChild(generatedDOM);

        thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

        thisCart.update();
    }

    update() {
        const thisCart = this;

        let deliveryFee = settings.cart.defaultDeliveryFee;
        let totalNumber = 0;
        let subtotalPrice = 0;

        for (let product of thisCart.products) {
            totalNumber += product.amountWidget.value;
            subtotalPrice += product.price;

        }
        if (totalNumber === 0) {
            thisCart.totalPrice = subtotalPrice;
            deliveryFee = 0;
        } else {
            thisCart.totalPrice = subtotalPrice + deliveryFee;
        }

        thisCart.totalNumber = totalNumber;
        thisCart.subtotalPrice = subtotalPrice;
        thisCart.deliveryFee = deliveryFee;
        thisCart.totalPrice = deliveryFee + subtotalPrice;
        thisCart.dom.deliveryFee.innerHTML = deliveryFee;
        thisCart.dom.subtotalPrice.innerHTML = subtotalPrice;
        thisCart.dom.totalPrice.innerHTML = thisCart.totalPrice;
        thisCart.dom.totalPriceHeader.innerHTML = thisCart.totalPrice;
        thisCart.dom.totalNumber.innerHTML = totalNumber;
    }

    remove(thisCartProduct) {
        const thisCart = this;
        thisCartProduct.dom.wrapper.remove();
        const indexOfProducts = thisCart.products.indexOf(thisCartProduct);
        thisCart.products.splice(indexOfProducts, 1);
        thisCart.update();
    }

    sendOrder() {
        const thisCart = this;

        const url = settings.db.url + '/' + settings.db.orders;
        const payload = {
            address: thisCart.dom.address.value,
            phone: thisCart.dom.phone.value,
            totalPrice: thisCart.totalPrice,
            subtotalPrice: thisCart.subtotalPrice,
            totalNumber: thisCart.totalNumber,
            deliveryFee: thisCart.deliveryFee,
            products: []
        };
        for (let prod of thisCart.products) {
            payload.products.push(prod.getData());
        }

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        };
        fetch(url, options);
        window.alert('Dziękujęmy za złożenie zamówenia :)');
    }
}

export default Cart;