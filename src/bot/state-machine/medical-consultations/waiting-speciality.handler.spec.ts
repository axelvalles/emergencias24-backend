import { MedicalConsultationsWaitingSpecialityHandler } from './waiting-speciality.handler';
import { BOT_STATES } from '../types';
import type { Services } from '../types';

describe('MedicalConsultationsWaitingSpecialityHandler', () => {
  const handler = new MedicalConsultationsWaitingSpecialityHandler();

  const services = {
    messaging: { sendMessage: jest.fn() },
    ticketsService: { create: jest.fn() },
    sessionStore: {} as never,
    patientsService: {} as never,
    municipalityPricingService: {} as never,
  } as unknown as Services;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes option 10 to the free-text specialty state', async () => {
    const result = await handler.handle(
      {
        from: '584120000000',
        body: '10',
        profileName: 'Ana',
        location: null,
      },
      {
        currentState: BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_SPECIALTY,
        from: '584120000000',
        lastInteraction: new Date().toISOString(),
        previousState: BOT_STATES.WAITING_MENU_OPTION,
        patient: null,
      },
      services,
    );

    expect(services.messaging.sendMessage).toHaveBeenCalledWith(
      '584120000000',
      expect.stringContaining('Escribe la especialidad'),
    );
    expect(result.nextState).toBe(
      BOT_STATES.MEDICAL_CONSULTATIONS_WAITING_OTHER,
    );
  });
});
