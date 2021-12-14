const STORAGE_STORIES = "stories";
const MODULE_NAME = "random-everything-generator";
document.RandomEverythingGeneratorData = {};

class RandomEverythingGenerator extends FormApplication{
    static ID = 'random-everything-generator';
    static TEMPLATES = {
        MAIN: `modules/${this.ID}/templates/random-everything-generator.hbs`,
        CATEGORY: `modules/${this.ID}/templates/category.hbs`
    };
    static log(force, ...args) {
        const shouldLog = force || game.modules.get('_dev_mode')?.api?.getPackageDebugValue(this.ID);
        if (shouldLog) {
            console.log(this.ID, '|', ...args);
        }
    };
    Categories;
    XML;
    Choices = {};
    Path = '';
    OnLoadChildCallback = () => {}

    constructor(object, options) {
        super(object, options);
    }

    get entity() {
        return this.object;
    }

    static get defaultOptions() {
        const overrides = {
            height: 'auto',
            width: 'auto',
            template: RandomEverythingGenerator.TEMPLATES.CATEGORY,
            title: 'Random Everything Generator',
            resizable: true,
            minimizable: true
        }

        return foundry.utils.mergeObject(super.defaultOptions, overrides);
    }

    getData(options) {
        return {
            categories: this.Categories,
            xml: this.XML,
            appid: this.id,
            path: '',
            choices: this.Choices
        };
    }

    async _updateObject(event, formData) {
        let doc = $.parseXML(this.XML);
        let category = $(doc).find(`category[id='${formData.category}']`)

        if (category.children().length > 0) {
            let choices = {}
            for (const subcat of category.children()) {
                choices[subcat.getAttribute('id')] = subcat.getAttribute('name');
            }
            let REGWindow = new RandomEverythingGenerator();
            REGWindow.XML = this.XML;
            REGWindow.Choices = choices;
            REGWindow.OnLoadChildCallback = this.OnLoadChildCallback;
            REGWindow.render(true);
        } else {
            if (!document.RandomEverythingGeneratorData['top'])
                document.RandomEverythingGeneratorData['top'] = formData.category;
            $.ajax({
                url: '/modules/random-everything-generator/markov-source/male-names.markov',
                success: markov => {
                    $.ajax({
                        url: `/modules/random-everything-generator/xml/${formData.category}.xml`,
                        dataType: 'text',
                        success: xmlStr => {
                            if (this.Path)
                                document.RandomEverythingGeneratorData[this.Path] = formData.category;
                            this.OnLoadChildCallback(this, category.attr('name'), formData.category, xmlStr);
                            console.log(this.Path)
                            let regChild = new REGChild(category.attr('name'));
                            regChild.XML = xmlStr;
                            regChild.Path = (this.Path) ? this.Path + '.' + formData.category : '';
                            regChild.Markov = markov;
                            regChild.render(true);
                        }
                    });
                }
            })
        }
    }
}

Hooks.once('devModeReady', ({ registerPackageDebugFlag }) => {
    registerPackageDebugFlag(RandomEverythingGenerator.ID);
})

Hooks.on("renderRollTableDirectory", (app, html, data) => {
    if (!game.user.isGM)
        return;

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

    let json = game.settings.get(MODULE_NAME, STORAGE_STORIES);
    let stories = (json) ? JSON.parse(json) : {};
    let story_options = [];
    for (let story of Object.keys(stories)) {
        story_options.push(`<option value="${story}">${story}</option>`);
    }

    const headerActions = html.find('div.header-actions');
    const buttonLabel = game.i18n.localize('RandomEverythingGenerator.button-title')
    const regButtonHtml =
        `<div class="header-reg action-buttons flexrow">
            <button class="reg" title="${buttonLabel}">${buttonLabel}</button>
            <select id="reg-select-story" class="reg" style="background-color:rgba(255,255,245,0.8);height:24px;margin:6px 6px 0px 6px;max-width:125px"">
                <option value="">Stories</option>
                ${story_options.join()}
            </select>   
        </div>`;
    headerActions.after(regButtonHtml);

    const regButton = html.find("button.reg");
    regButton.on('click', event => {
        event.preventDefault();

        if ($('.reg-title').length > 0) {
            ui.notifications.error("Can only create one story at a time")
            return;
        }

        RandomEverythingGenerator.log(true, "Opening RandomEverythingGenerator Form");

        $.get('/modules/random-everything-generator/xml/_categories.xml', xml => {
            const nodeTop = $(xml).find('categories')[0]; // Guaranteed top level node
            const nodeCategories = nodeTop.children;
            const categories = [];
            categories.push(buildCategory(nodeCategories));
            RandomEverythingGenerator.log(true, categories);

            document.RandomEverythingGeneratorData = {};
            let reg = new RandomEverythingGenerator();
            reg.Categories = categories[0];
            reg.XML = (new XMLSerializer()).serializeToString(xml);

            for (const node of nodeCategories) {
                reg.Choices[node.getAttribute('id')] = node.getAttribute('name')
            }

            reg.render(true);

        })
    });

    const regStorySelect = html.find("select.reg");
    regStorySelect.on('change', event => {
        let select = document.getElementById('reg-select-story');
        let json = game.settings.get(MODULE_NAME, STORAGE_STORIES);
        let stories = (json) ? JSON.parse(json) : {};
        let story = stories[select.value];
        document.RandomEverythingGeneratorData = story;
        document.RandomEverythingGeneratorData['save'] = select.value
        $.ajax({
            url: '/modules/random-everything-generator/markov-source/male-names.markov',
            success: markov => {
                $.ajax({
                    url: `/modules/random-everything-generator/xml/${story.top}.xml`,
                    dataType: 'text',
                    success: xmlStr => {
                        console.log(story.top)
                        let regChild = new REGChild(story.save);
                        regChild.XML = xmlStr;
                        regChild.path = '';
                        regChild.Markov = markov;
                        regChild.render(true);
                        select.selectedIndex = 0;
                    }
                });
            }
        })
    })
});

Hooks.on("init", async(app, hmtl) => {
    await game.settings.register(MODULE_NAME, STORAGE_STORIES, {
        name: 'Stories JSON',
        hint: 'Stories. Do not edit',
        scope: 'world',
        config: false,
        type: String,
        default: '',
        onChange: value => {
            console.log(`${MODULE_NAME}: Updated Stories`)
        }
    });
});

Hooks.on('renderREGChild', (app, html, data) => {
    let saveBtn = $(`<a class="reg-save"><i class="far fa-save"></i>Save</a>`);
    saveBtn.click(ev => {
        let saveApp = new REGTitle();
        saveApp.render(true);
    });
    html.closest('.app').find('.reg-save').remove();
    let titleElement = html.closest('.app').find('.window-title');
    saveBtn.insertAfter(titleElement);

    if (!app.Path && document.RandomEverythingGeneratorData.save) {
        let delBtn = $(`<a class="reg-delete"><i class="far fa-trash-alt"></i>Delete</a>`);
        delBtn.click(ev => {
            let json = game.settings.get(MODULE_NAME, STORAGE_STORIES);
            let stories = (json) ? JSON.parse(json) : {};
            delete stories[document.RandomEverythingGeneratorData.save];
            for (child of document.getElementById('reg-select-story').childNodes) {
                if (child.value == document.RandomEverythingGeneratorData.save) {
                    child.parentNode.removeChild(child);
                }
            }
            document.RandomEverythingGeneratorData = {};
            game.settings.set(MODULE_NAME, STORAGE_STORIES, JSON.stringify(stories));
            app.close();
        });
        html.closest('.app').find('.reg-del').remove();
        delBtn.insertAfter(titleElement);
    }
})

