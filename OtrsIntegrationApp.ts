import { IConfigurationExtend, IConfigurationModify, IEnvironmentRead, IHttp, ILogger, IMessageBuilder, IMessageExtender, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IMessage, IMessageAttachment, IPreMessageSentModify } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { SettingType, ISetting } from '@rocket.chat/apps-engine/definition/settings';

export class OtrsIntegration extends App implements IPreMessageSentModify {
    private ticketNumberFormat;

    constructor(info: IAppInfo, logger: ILogger) {
        super(info, logger);
        this.ticketNumberFormat = [];
    }

    private parseConfig(text) {
        let newTicketNumberFormat = [];

        try {
            newTicketNumberFormat = JSON.parse(text);
            this.ticketNumberFormat = newTicketNumberFormat;

            return true;
        } catch (e) {
            return false;
        }
    }

    public async onEnable(environment: IEnvironmentRead, configurationModify: IConfigurationModify): Promise<boolean> {
        const metaTicketNumberFormat = await environment.getSettings().getValueById('ticketNumberFormat') as string;

        return this.parseConfig(metaTicketNumberFormat);
    }

    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {
        if (setting.id !== 'ticketNumberFormat') {
            return;
        }

        this.parseConfig(setting.value);
    }

    public async checkPreMessageSentModify(message: IMessage): Promise<boolean> {
        return typeof message.text === 'string';
    }

    public async executePreMessageSentModify(message: IMessage, builder: IMessageBuilder, read: IRead, http: IHttp, persistence: IPersistence): Promise<IMessage> {
        let text = message.text || '';

        text = text.replace(new RegExp(this.ticketNumberFormat), 'replace-test');

        return builder.setText(text).getMessage();
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await configuration.settings.provideSetting({
            id: 'ticketNumberFormat',
            type: SettingType.STRING,
            packageValue: '([12]\d{3}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{8})',
            required: false,
            public: false,
            multiline: true,
            i18nLabel: 'OTRS_TicketNumberFormat',
            i18nDescription: 'OTRS_TicketNumberFormat_Description',
        });
    }
}
