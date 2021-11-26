class RandomEverythingGenerator extends FormApplication{
    static ID = 'random-everything-generator';
    static TEMPLATES = {
        MAIN: `modules/${this.ID}/templates/random-everything-generator.hbs`
    };
    static log(force, ...args) {
        const shouldLog = force || game.modules.get('_dev_mode')?.api?.getPackageDebugValue(this.ID);
        if (shouldLog) {
            console.log(this.ID, '|', ...args);
        }
    };
    Categories;
    XML;

    static get defaultOptions() {
        const overrides = {
            height: 310,
            width: 1000,
            id: 'random-everything-generator',
            template: RandomEverythingGenerator.TEMPLATES.MAIN,
            title: 'Random Everything Generator',
            resizable: true,
            minimizable: true
        }

        return foundry.utils.mergeObject(super.defaultOptions, overrides);
    }

    getData(options) {
        return {
            categories: this.Categories,
            xml: this.XML
        };
    }
}

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(RandomEverythingGenerator.ID);
})

Hooks.on("renderRollTableDirectory", (app, html, data) => {
    let buildCategory = function(nodeCategories) {
        let r = [];
        for (const node of nodeCategories) { // Each of the top-level categories
            let cat = {
                id: node.getAttribute('id'),
                name: node.getAttribute('name'),
                subcategories: (node.children.length) ? buildCategory(node.children) : []
            };
            r.push(cat);
        }

        return r;
    }
    const headerActions = html.find('div.header-actions');
    const buttonLabel = game.i18n.localize('RandomEverythingGenerator.button-title')
    const regButtonHtml =
        `<div class="header-reg action-buttons">
            <button class="reg">${buttonLabel}</button>
        </div>`;

    headerActions.after(regButtonHtml);

    const regButton = html.find("button.reg");
    regButton.on('click', event => {
        event.preventDefault();
        RandomEverythingGenerator.log(true, "Opening RandomEverythingGenerator Form");

        let xhr = new XMLHttpRequest();
        xhr.open('GET', '/modules/random-everything-generator/xml/_categories.xml');
        xhr.send();
        xhr.onload = function() {
            // Add a list item for every top-level category
            const xmlStr = xhr.response;
            const parser = new DOMParser();
            const doc = parser.parseFromString(xmlStr, 'application/xml');
            const nodeTop = doc.getElementsByTagName('categories')[0]; // Guaranteed top level node
            const nodeCategories = nodeTop.children;
            const categories = [];
            categories.push(buildCategory(nodeCategories));
            RandomEverythingGenerator.log(true, categories);

            // Most of the work is going to be performed in random-everything-generator.hbs
            let reg = new RandomEverythingGenerator();
            reg.Categories = categories[0];
            reg.XML = xmlStr;
            reg.render(true);
        }
    })
});