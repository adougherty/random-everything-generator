class REGChild extends Application{
    static ID = 'random-everything-generator';
    static TEMPLATES = {
        MAIN: `modules/${this.ID}/templates/random-everything-generator-child.hbs`,
        NOUN: `modules/${this.ID}/templates/noun.hbs`
    };
    static log(force, ...args) {
        const shouldLog = force || game.modules.get('_dev_mode')?.api?.getPackageDebugValue(this.ID);
        if (shouldLog) {
            console.log(this.ID, '|', ...args);
        }
    };
    Title;
    XML;
    Path = '';
    Markov;
    Members = {};
    LinkedMembers = [];

    constructor(title, noun=false) {
        super({
            title: `${title} - Random Everything Generator`,
            template: (noun) ? REGChild.TEMPLATES.NOUN : REGChild.TEMPLATES.MAIN,
            height: (noun) ? '500' : 'auto'
        });
        this.Title = title;

    }

    static get defaultOptions() {
        const overrides = {
            width: 'auto',
            resizable: true,
            minimizable: true,
            editable: true
        }

        return foundry.utils.mergeObject(super.defaultOptions, overrides);
    }

    async loadMembers() {
        let getCache = {};
        for (let key of Object.keys(document.RandomEverythingGeneratorData)) {
            let re = new RegExp(this.Path + '\._member\.(\\d+)\\.(.*)\\.');
            let m = key.match(re);
            if (m) {
                let  label = m[2];

                if (getCache[m[1] + '.' + m[2]])
                    continue;
                getCache[m[1] + '.' + m[2]] = true;
                await $.get(`/modules/random-everything-generator/xml/${m[2]}.xml`, xml => {
                    let category = $(xml).find('category');
                    label = $(category).attr('name');

                    this.LinkedMembers.push({
                        index: m[1],
                        label,
                        path: this.Path + `._member.${m[1]}.${m[2]}`,
                        xml: (new XMLSerializer()).serializeToString(xml)
                    });
                });
            }
        }
    }

    async getData(options) {
        if (!this.Members.length) {
            let doc = $.parseXML(this.XML);
            let memberNodes = $(doc).find('member');
            for (const member of memberNodes) {
                this.Members[$(member).attr('include')] = $(member).attr('name');
            }
        }

        await this.loadMembers();

        return {
            title: this.Title,
            xml: this.XML,
            appid: this.id,
            path: this.Path,
            markov: this.Markov,
            data: (document.RandomEverythingGeneratorData[this.Path]) ? document.RandomEverythingGeneratorData[this.Path] : 'Hello World',
            owner: game.user.id,
            members: this.Members,
            linkedMembers: this.LinkedMembers
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(`#${this.id}-add-member`).change(ev => this.addMember(html));

        for (let member of this.LinkedMembers) {
            html.find(`#${this.id}-member-${member.index}`).click(ev => {
                let regChild = new REGChild(member.label)
                regChild.XML = member.xml;
                regChild.Path = member.path
                regChild.Markov = this.Markov;
                regChild.render(true);
            });
        }
    }

    nextMemberIndex(base) {
        let idx = 0;
        let re = new RegExp(base + '(\\d+)');
        console.log(base + '(\\d+)')
        for (let key of Object.keys(document.RandomEverythingGeneratorData)) {
            let m = key.match(re)
            if (m) {
                idx = Math.max(idx, parseInt(m[1])+1);
            }
        }
        return idx;
    }

    addMember(html) {
        let path = this.Path + '._member.'+this.nextMemberIndex(this.Path + '._member.');
        let markov = this.Markov;
        let option = html.find(`#${this.id}-add-member option:selected`);
        let div = document.createElement('DIV');
        $(div).addClass('reg-member')
        $(div).text(option.text());
        let container = html.find(`#${this.id}-members-list`);
        container.append(div);
        $.ajax({
            url: `/modules/random-everything-generator/xml/${option.val()}.xml`,
            dataType: 'text',
            success: xmlStr => {
                let regChild = new REGChild(option.text())
                regChild.XML = xmlStr;
                regChild.Path = path + '.' + option.val();
                regChild.Markov = markov;
                regChild.render(true);
            }
        });
    }
}

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

