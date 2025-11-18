import { describe, it, expect } from 'vitest';
import { buildIso20022Xml } from '../xmlBuilder';
import { validateXml } from '../validator';
import { MessagePayload } from '@shared/types';

const baseNow = new Date().toISOString();

function samplePayload(type: MessagePayload['type']): MessagePayload {
  switch (type) {
    case 'pain.001':
      return {
        type,
        payload: {
          messageId: 'TEST-PAIN',
          creationDateTime: baseNow,
          initiatingParty: 'Test',
          requestedExecutionDate: baseNow.slice(0, 10),
          debtor: { name: 'Tester', iban: 'DE75512108001245126199' },
          debtorAccount: 'DE75512108001245126199',
          transactions: [
            {
              endToEndId: 'E2E',
              amount: 10.5,
              currency: 'EUR',
              debtor: { name: 'Tester', iban: 'DE75512108001245126199' },
              creditor: { name: 'Receiver', iban: 'DE44500105175407324931' },
              creditorAccount: 'DE44500105175407324931'
            }
          ]
        }
      };
    case 'pacs.008':
      return {
        type,
        payload: {
          messageId: 'TEST-PACS',
          creationDateTime: baseNow,
          settlementMethod: 'COVE',
          transactions: [
            {
              endToEndId: 'E2E',
              amount: 10.5,
              currency: 'EUR',
              debtor: { name: 'Bank A', bic: 'DEUTDEFFXXX', iban: 'DE75512108001245126199' },
              debtorAccount: 'DE75512108001245126199',
              creditor: { name: 'Bank B', bic: 'COBADEFFXXX', iban: 'DE44500105175407324931' },
              creditorAccount: 'DE44500105175407324931'
            }
          ]
        }
      };
    case 'pacs.009':
      return {
        type,
        payload: {
          messageId: 'TEST-PACS009',
          creationDateTime: baseNow,
          settlementMethod: 'COVE',
          transactions: [
            {
              endToEndId: 'E2E-009',
              amount: 20.75,
              currency: 'USD',
              debtor: { name: 'Bank A', bic: 'CHASUS33', iban: 'GB33BUKB20201555555555' },
              debtorAccount: 'GB33BUKB20201555555555',
              creditor: { name: 'Bank B', bic: 'BOFAUS3N', iban: 'GB29NWBK60161331926819' },
              creditorAccount: 'GB29NWBK60161331926819'
            }
          ]
        }
      };
    case 'pacs.002':
      return {
        type,
        payload: {
          messageId: 'TEST-PACS002',
          creationDateTime: baseNow,
          originalMessageId: 'ORIGINAL-MSG-123',
          originalMessageNameId: 'pacs.008.001.10',
          groupStatus: 'ACCP',
          statusReasonCode: 'G000'
        }
      };
    case 'camt.053':
      return {
        type,
        payload: {
          messageId: 'TEST-CAMT',
          creationDateTime: baseNow,
          account: { iban: 'FR1420041010050500013M02606', currency: 'EUR', name: 'Test account' },
          balances: [{ type: 'OPBD', amount: 1000, currency: 'EUR' }],
          entries: [
            {
              amount: 100,
              currency: 'EUR',
              creditDebit: 'CRDT',
              bookingDate: baseNow.slice(0, 10),
              valueDate: baseNow.slice(0, 10)
            }
          ]
        }
      };
  }
}

(['pain.001', 'pacs.008', 'pacs.009', 'pacs.002', 'camt.053'] as const).forEach((type) => {
  describe(`${type} generation`, () => {
    it('builds XML that validates against schema', async () => {
      const payload = samplePayload(type);
      const xml = buildIso20022Xml(payload);
      const validation = await validateXml(xml, type);
      expect(validation.valid).toBe(true);
    });
  });
});
