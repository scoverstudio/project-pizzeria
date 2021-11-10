import AmountWidget from "../components/AmountWidget.js";
import {
    select,
    classNames,
    templates
} from "../settings.js";
import {
    utils
} from "../utils.js";


class Product {
    constructor(id, data) {
        const thisProduct = this;

        thisProduct.id = id;
        thisProduct.data = data;

        thisProduct.renderInMenu();
        thisProduct.getElements();
        thisProduct.initAccordion();
        thisProduct.initOrderForm();
        thisProduct.initAmountWidget();
        thisProduct.processOrder();
    }

    renderInMenu() {
        const thisProduct = this;

        const generatedHTML = templates.menuProduct(thisProduct.data);
        thisProduct.element = utils.createDOMFromHTML(generatedHTML);

        const menuContainer = document.querySelector(select.containerOf.menu);

        menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
        const thisProduct = this;

        thisProduct.dom = {};

        thisProduct.accordionTrigger = thisProduct.element.querySelector(
            select.menuProduct.clickable
        );
        thisProduct.form = thisProduct.element.querySelector(
            select.menuProduct.form
        );
        thisProduct.formInputs = thisProduct.form.querySelectorAll(
            select.all.formInputs
        );
        thisProduct.cartButton = thisProduct.element.querySelector(
            select.menuProduct.cartButton
        );
        thisProduct.priceElem = thisProduct.element.querySelector(
            select.menuProduct.priceElem
        );
        thisProduct.imageWrapper = thisProduct.element.querySelector(
            select.menuProduct.imageWrapper
        );
        thisProduct.amountWidgetElem = thisProduct.element.querySelector(
            select.menuProduct.amountWidget
        );
    }

    initAccordion() {
        const thisProduct = this;

        thisProduct.accordionTrigger.addEventListener("click", function (event) {
            event.preventDefault();

            const activeProduct = document.querySelector(".product.active");
            const activeClass = classNames.menuProduct.wrapperActive;
            if (activeProduct) {
                activeProduct.classList.remove(activeClass);
            }
            thisProduct.element.classList.toggle(activeClass);
        });
    }

    initOrderForm() {
        const thisProduct = this;

        thisProduct.form.addEventListener("submit", function (event) {
            event.preventDefault();
            thisProduct.processOrder();
        });
        for (let input of thisProduct.formInputs) {
            input.addEventListener("change", function () {
                thisProduct.processOrder();
            });
        }
        thisProduct.cartButton.addEventListener("click", function (event) {
            event.preventDefault();
            thisProduct.processOrder();
            thisProduct.addToCart();
        });
    }

    processOrder() {
        const thisProduct = this;

        const formData = utils.serializeFormToObject(thisProduct.form);
        let price = thisProduct.data.price;

        for (let paramId in thisProduct.data.params) {
            const param = thisProduct.data.params[paramId];

            for (let optionId in param.options) {
                const option = param.options[optionId];
                const imageAddons = thisProduct.imageWrapper.querySelector(
                    `.${paramId}-${optionId}`
                );

                if (formData[paramId] && formData[paramId].includes(optionId)) {
                    if (imageAddons) {
                        imageAddons.classList.add("active");
                    }

                    if (!option.default) {
                        price += option.price;
                    }
                } else {
                    if (option.default) {
                        price -= option.price;
                    }
                    if (imageAddons) {
                        imageAddons.classList.remove("active");
                    }
                }
            }
        }
        thisProduct.priceSingle = price;
        price *= thisProduct.amountWidget.value;
        thisProduct.priceElem.innerHTML = price;
    }

    initAmountWidget() {
        const thisProduct = this;

        thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
        thisProduct.amountWidgetElem.addEventListener("updated", function () {
            thisProduct.processOrder();
        });
    }

    addToCart() {
        const thisProduct = this;

        thisProduct.name = thisProduct.data.name;
        thisProduct.amount = thisProduct.amountWidget.value;
        thisProduct.price = thisProduct.priceSingle;


        const event = new CustomEvent('add-to-cart', {
            bubbles: true,
            detail: {
                product: thisProduct,
            }
        });
        thisProduct.element.dispatchEvent(event);
    }

    prepareCartProduct() {
        const thisProduct = this;

        const productSummary = {
            id: thisProduct.id,
            name: thisProduct.data.name,
            amount: thisProduct.amountWidget.value,
            priceSingle: thisProduct.priceSingle,
            price: thisProduct.priceSingle * thisProduct.amountWidget.value,
            params: thisProduct.prepareCartProductParams(),
        };
        return productSummary;
    }

    prepareCartProductParams() {
        const thisProduct = this;

        const formData = utils.serializeFormToObject(thisProduct.form);
        const params = {};

        for (let paramId in thisProduct.data.params) {
            const param = thisProduct.data.params[paramId];

            params[paramId] = {
                label: param.label,
                options: {},
            };

            for (let optionId in param.options) {
                const option = param.options[optionId];
                const optionSelected =
                    formData[paramId] && formData[paramId].includes(optionId);
                if (optionSelected) {
                    params[paramId].options[optionId] = option.label;
                }
            }
        }
        return params;
    }
}

export default Product;