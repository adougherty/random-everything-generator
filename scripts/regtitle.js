//const STORAGE_STORIES = "stories";
//const MODULE_NAME = "random-everything-generator";
class REGTitle extends FormApplication {
    static get defaultOptions() {
        const overrides = {
            height: 100,
            width: 200,
            template: `modules/random-everything-generator/templates/title.hbs`,
            title: 'Random Everything Generator - Save',
            resizable: false,
            minimizable: false
        }

        return foundry.utils.mergeObject(super.defaultOptions, overrides);
    }

    getData(options) {
        return {
            title: document.RandomEverythingGeneratorData['save']
        };
    }

    async _updateObject(event, formData) {
        if (game.user.isGM) {
            let json = game.settings.get(MODULE_NAME, STORAGE_STORIES);
            let stories = (json) ? JSON.parse(json) : {};
            stories[formData['reg-title']] = document.RandomEverythingGeneratorData

            // Add a new Story option, if this option does not already exist
            if ($('#reg-select-story').find(`option[value="${formData['reg-title']}"]`).length==0) {
                let option = document.createElement('OPTION');
                option.value = formData['reg-title'];
                option.innerHTML = formData['reg-title'];
                document.getElementById('reg-select-story').appendChild(option)
            }
            
            game.settings.set(MODULE_NAME, STORAGE_STORIES, JSON.stringify(stories));
            this.render();

        } else {
            ui.notifications.error("You have to be GM to save stories.");
        }
    }
}
