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

    static start(argCategory = null) {
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

        if ($('.reg-title').length > 0) {
            ui.notifications.error("Can only create one story at a time")
            return;
        }

        document.RandomEverythingGeneratorData = {};
        RandomEverythingGenerator.log(false, "Opening RandomEverythingGenerator Form");

        $.get('/modules/random-everything-generator/xml/_categories.xml', xml => {
            if (argCategory && $(xml).find(`category[id='${argCategory}']`).length > 0) {
                let category = $(xml).find(`category[id='${argCategory}']`)

                if (category.children().length > 0) {
                    let choices = {}
                    for (const subcat of category.children()) {
                        choices[subcat.getAttribute('id')] = subcat.getAttribute('name');
                    }
                    let REGWindow = new RandomEverythingGenerator();
                    REGWindow.XML = (new XMLSerializer()).serializeToString(xml);;
                    REGWindow.Choices = choices;
                    REGWindow.render(true);
                } else {
                    document.RandomEverythingGeneratorData['top'] = argCategory;
                    $.ajax({
                        url: '/modules/random-everything-generator/markov-source/male-names.markov',
                        success: markov => {
                            $.ajax({
                                url: `/modules/random-everything-generator/xml/${argCategory}.xml`,
                                dataType: 'text',
                                success: xmlStr => {
                                    let xml = $.parseXML(xmlStr);
                                    let category = $(xml).find('category')[0];
                                    let name = $(category).attr('name');
                                    let regChild = new REGChild(name);
                                    regChild.XML = xmlStr;
                                    regChild.Markov = markov;
                                    regChild.render(true);
                                }
                            });
                        }
                    })
                }
            } else {
                const nodeTop = $(xml).find('categories')[0]; // Guaranteed top level node
                const nodeCategories = nodeTop.children;
                const categories = [];
                categories.push(buildCategory(nodeCategories));
                RandomEverythingGenerator.log(false, categories);

                document.RandomEverythingGeneratorData = {};
                let reg = new RandomEverythingGenerator();
                reg.Categories = categories[0];
                reg.XML = (new XMLSerializer()).serializeToString(xml);

                for (const node of nodeCategories) {
                    reg.Choices[node.getAttribute('id')] = node.getAttribute('name')
                }

                reg.render(true);                
            }

        })
    }

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
                            RandomEverythingGenerator.log(false, this.Path)
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

    let json = game.settings.get(MODULE_NAME, STORAGE_STORIES);
    let stories = (json) ? JSON.parse(json) : {};
    let story_options = [];
    for (let story of Object.keys(stories)) {
        story_options.push(`<option value="${story}">${story}</option>`);
    }

    const headerActions = html.find('div.header-actions');
    const buttonLabel = game.i18n.localize('RandomEverythingGenerator.button-label')
    const buttonTitle = game.i18n.localize('RandomEverythingGenerator.button-title')
    const regButtonHtml =
        `<div class="header-reg action-buttons flexrow">
            <button class="reg" title="${buttonTitle}" stlye="max-width:20px">${buttonLabel}</button>
            <select id="reg-select-story" class="reg" style="background-color:rgba(255,255,245,0.8);height:24px;margin:6px 6px 0px 6px;max-width:125px"">
                <option value="">Stories</option>
                ${story_options.join()}
            </select>   
        </div>`;
    headerActions.after(regButtonHtml);

    const regButton = html.find("button.reg");
    regButton.on('click', event => {
        event.preventDefault();
        RandomEverythingGenerator.start();
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
                        RandomEverythingGenerator.log(false, story.top)
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
            RandomEverythingGenerator.log(false, `${MODULE_NAME}: Updated Stories`)
        }
    });
});

Hooks.on('renderREGChild', (app, html, data) => {
    let titleElement = html.closest('.app').find('.window-title');

    // Save button
    let saveBtn = $(`<a class="reg-save"><i class="far fa-save"></i>Save</a>`);
    saveBtn.click(ev => {
        let saveApp = new REGTitle();
        saveApp.render(true);
    });
    html.closest('.app').find('.reg-save').remove();
    saveBtn.insertAfter(titleElement);

    // Export Button
    let exportBtn = $(`<a class="reg-export"><i class="fas fa-file-export"></i>Export</a>`);
    exportBtn.click(ev => {
        let xml = $.parseXML(app.XML);
        let category = $(xml).find('category');
        let exportType = $(category)?.attr('export') || 'JournalEntry'
        switch (exportType) {
            case 'ActorSheet': {
                $.get('/modules/random-everything-generator/xml/npc_race.xml', async (raceXML) => {
                    let races = {};
                    let xmlRaces = $(raceXML).find('value');
                    $(xmlRaces).each(v => {
                        let race = xmlRaces[v];
                        let creatureType = $(race).attr('creatureType5e') || race.innerHTML;
                        creatureType += ($(race).attr('subtype5e')) ? ` (${$(race).attr('subtype5e')})` : '';
                        races[race.innerHTML] = {
                            creatureType,
                            value: $(race).attr('creatureType5e') || race.innerHTML,
                            subtype: $(race).attr('subtype5e'),
                            race: $(race).attr('race5e')
                        }
                    })

                    RandomEverythingGenerator.log(true, 'Saving to ActorSheet');
                    let xml = $.parseXML(app.XML);
                    let name = document.RandomEverythingGeneratorData[`${app.Path}.name`];
                    let creatureType = document.RandomEverythingGeneratorData[`${app.Path}.npc_race`]
                    let tableAlignment = $(xml).find('table#npc_alignment')[0];
                    let alignments = $(tableAlignment).children()
                    let alignment = alignments[document.RandomEverythingGeneratorData[`${app.Path}.npc_alignment`]].innerHTML;
                    let biography = "<div>";
                    Object.keys(document.RandomEverythingGeneratorData).forEach(key => {
                        if (key.match(`^${app.Path}\\.`)) {
                            let id = key.substr(1); // Remove leading period
                            let xmlTable = $(xml).find(`#${id}`)[0];
                            if (!xmlTable)
                                xmlTable = $(xml).find(`[include="${id}"]`)[0]
                            let xmlValue = $(xmlTable).children();
                            let value = '';
                            if (document.RandomEverythingGeneratorData[key] == parseInt(document.RandomEverythingGeneratorData[key])) { // isInt()
                                value = xmlValue[document.RandomEverythingGeneratorData[key]].innerHTML;
                            } else {
                                value = document.RandomEverythingGeneratorData[key];
                            }
                            let label = $(xmlTable).attr('short') || $(xmlTable).attr('name');
                            if (label) {
                                biography += `<div>${label}: ${value}</div>\n`
                            }
                        }
                    });
                    biography += "</div>"

                    let actor = await Actor.create({
                      name: name,
                      type: 'npc',
                      img: "icons/svg/mystery-man.svg"
                    });
                    await actor.update({
                        'data.details.type.subtype': races[creatureType].subtype,
                        'data.details.type.value': races[creatureType].value.toLowerCase(),
                        'data.details.alignment': alignment,
                        'data.details.biography': {value: biography}
                    });
                })
                break;
            }
            case 'JournalEntry': {
                break;
            }
        }
    });
    html.closest('.app').find('.reg-export').remove();
    exportBtn.insertAfter(titleElement);

    // Delete Button
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

