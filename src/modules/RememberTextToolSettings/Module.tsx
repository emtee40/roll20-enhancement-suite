import {R20Module} from '../../utils/R20Module'
import {EventSubscriber} from "../../utils/EventSubscriber";

class RememberTextToolSettingsModule extends R20Module.OnAppLoadBase {

    private static readonly colorSelectId = "font-color";
    private static readonly sizeSelectId = "font-size";
    private static readonly fontSelectId = "font-family";


    private static readonly idToConfig = {
        [RememberTextToolSettingsModule.colorSelectId]: "color",
        [RememberTextToolSettingsModule.sizeSelectId]: "size",
        [RememberTextToolSettingsModule.fontSelectId]: "font",
    };

    private _events: EventSubscriber[];

    constructor() {
        super(__dirname);

        const getById = (id: string) => $(`#${id}`);

        this._events = [
            new EventSubscriber("change", this.onChangeProp, () => getById(RememberTextToolSettingsModule.colorSelectId)),
            new EventSubscriber("change", this.onChangeProp, () => getById(RememberTextToolSettingsModule.sizeSelectId)),
            new EventSubscriber("change", this.onChangeProp, () => getById(RememberTextToolSettingsModule.fontSelectId)),
        ];
    }

    onChangeProp = (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (!target.id) {
            return;
        }

        const configKey = RememberTextToolSettingsModule.idToConfig[target.id];

        if (!configKey) {
            return;
        }

        const value = target.value;

        this.setConfigValue(configKey, value);
    };

    private onSettingChange = (key, oldVal, value) => {
        const expectedKey = "copyTextSettingsOnSelect";
        if (key !== expectedKey) return;

        window.r20es[expectedKey] = value;
    };

    private setFontSettingValueFromConfig(id: string) {
        const cfgValue = this.getHook().config[RememberTextToolSettingsModule.idToConfig[id]];

        const $widget = $(`#${id}`);
        $widget.val(cfgValue);
        return $widget;
    }

    public setup() {
        for (const event of this._events) {
            event.subscribe();
        }

        const $col = this.setFontSettingValueFromConfig(RememberTextToolSettingsModule.colorSelectId);
        $col.trigger("change-silent");

        this.setFontSettingValueFromConfig(RememberTextToolSettingsModule.sizeSelectId);
        this.setFontSettingValueFromConfig(RememberTextToolSettingsModule.fontSelectId);
    }

    public dispose() {
        for (const event of this._events) {
            event.unsubscribe();
        }
    }
}

if (R20Module.canInstall()) new RememberTextToolSettingsModule().install();
