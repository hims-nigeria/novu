import { UserSession } from '@novu/testing';
import { expect } from 'chai';
import { ChannelTypeEnum, EmailProviderIdEnum } from '@novu/shared';

const ORIGINAL_IS_MULTI_PROVIDER_CONFIGURATION_ENABLED = process.env.IS_MULTI_PROVIDER_CONFIGURATION_ENABLED;

describe('Get Integrations - /integrations (GET)', function () {
  let session: UserSession;

  beforeEach(async () => {
    session = new UserSession();
    await session.initialize();
    process.env.IS_MULTI_PROVIDER_CONFIGURATION_ENABLED = 'true';
  });

  afterEach(async () => {
    process.env.IS_MULTI_PROVIDER_CONFIGURATION_ENABLED = ORIGINAL_IS_MULTI_PROVIDER_CONFIGURATION_ENABLED;
  });

  it('should retrieve all the integrations of all environments from an organization from the prefilled test data', async () => {
    const integrations = (await session.testAgent.get(`/v1/integrations`)).body.data;

    expect(integrations.length).to.eq(12);

    const emailIntegrations = integrations.filter((integration) => integration.channel === ChannelTypeEnum.EMAIL);
    expect(emailIntegrations.length).to.eql(2);

    for (const emailIntegration of emailIntegrations) {
      expect(emailIntegration.providerId).to.equal(EmailProviderIdEnum.SendGrid);
      expect(emailIntegration.credentials.apiKey).to.equal('SG.123');
      expect(emailIntegration.credentials.secretKey).to.equal('abc');
      expect(emailIntegration.active).to.equal(true);
    }

    const smsIntegrations = integrations.filter((integration) => integration.channel === ChannelTypeEnum.SMS);
    expect(smsIntegrations.length).to.eql(2);

    const pushIntegrations = integrations.filter((integration) => integration.channel === ChannelTypeEnum.PUSH);
    expect(pushIntegrations.length).to.eql(2);

    const chatIntegrations = integrations.filter((integration) => integration.channel === ChannelTypeEnum.CHAT);
    expect(chatIntegrations.length).to.eql(4);

    const inAppIntegrations = integrations.filter((integration) => integration.channel === ChannelTypeEnum.IN_APP);
    expect(inAppIntegrations.length).to.eql(2);
  });

  it('should get custom SMTP integration details with TLS options', async function () {
    const nodeMailerProviderPayload = {
      providerId: EmailProviderIdEnum.CustomSMTP,
      channel: ChannelTypeEnum.EMAIL,
      credentials: {
        host: 'smtp.example.com',
        port: '587',
        secure: true,
        requireTls: true,
        tlsOptions: { rejectUnauthorized: false },
      },
      active: true,
      check: false,
    };

    // create nodemailer integration added to the existing sendgrid integration
    await session.testAgent.post('/v1/integrations').send(nodeMailerProviderPayload);

    const activeIntegrations = (await session.testAgent.get(`/v1/integrations/active`)).body.data;

    expect(activeIntegrations.length).to.eq(13);

    const activeEmailIntegrations = activeIntegrations.filter(
      (integration) =>
        integration.channel == ChannelTypeEnum.EMAIL && integration._environmentId === session.environment._id
    );

    expect(activeEmailIntegrations.length).to.eq(2);

    const customSmtp = activeEmailIntegrations.find((el) => el.providerId === EmailProviderIdEnum.CustomSMTP);

    expect(customSmtp.active).to.eql(true);
    expect(customSmtp.credentials?.host).to.equal(nodeMailerProviderPayload.credentials.host);
    expect(customSmtp.credentials?.port).to.equal(nodeMailerProviderPayload.credentials.port);
    expect(customSmtp.credentials?.secure).to.equal(nodeMailerProviderPayload.credentials.secure);
    expect(customSmtp.credentials?.requireTls).to.equal(nodeMailerProviderPayload.credentials.requireTls);
    expect(customSmtp.credentials?.tlsOptions).to.instanceOf(Object);
    expect(customSmtp.credentials?.tlsOptions).to.eql(nodeMailerProviderPayload.credentials.tlsOptions);
    expect(customSmtp.active).to.equal(true);
  });
});
