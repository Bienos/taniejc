import {describe, expect, it} from 'vitest';
import {clearPrivatePurchaseData, loadLocalSnapshot, LOCAL_STATE_KEY, saveLocalSnapshot} from '../lib/storage';

function storage(values: Record<string,string> = {}) {
  const data = new Map(Object.entries(values));
  return {getItem: (key:string) => data.get(key) ?? null, setItem: (key:string,value:string) => {data.set(key,value)}, removeItem: (key:string) => {data.delete(key)}};
}

describe('local state migrations', () => {
  it('migrates existing v1 list, receipts and preferences to v2 without losing them', () => {
    const db = storage({'taniej-list-v1':'[{"id":"item","name":"Mleko"}]','taniej-receipts-v1':'[{"id":"receipt","store":"Lidl","date":"2026-10-20","total":"4.99","lines":[]}]','taniej-city-v1':'Kraków'});
    const migrated = loadLocalSnapshot(db);
    expect(migrated).toMatchObject({version:2,city:'Kraków',items:[{id:'item',name:'Mleko'}],receipts:[{id:'receipt',store:'Lidl'}]});
    expect(saveLocalSnapshot(db,migrated)).toBe(true);
    expect(JSON.parse(db.getItem(LOCAL_STATE_KEY)!).version).toBe(2);
  });
  it('recovers from malformed JSON and removes private histories without deleting the list', () => {
    const db = storage({'taniej-local-v2':'not-json','taniej-list-v1':'bad-json'});
    expect(loadLocalSnapshot(db).items).toEqual([]);
    saveLocalSnapshot(db,{version:2,city:'Warszawa',items:[{id:'i',name:'Mleko'}],saved:[],receipts:[{id:'r',store:'Lidl',date:'2026-10-20',total:'4.99',lines:[]}],prices:[{id:'p',productCode:'1',paidGrosz:499}],alerts:[{productCode:'1',targetGrosz:400}]});
    expect(clearPrivatePurchaseData(db)).toBe(true);
    expect(loadLocalSnapshot(db)).toMatchObject({items:[{id:'i',name:'Mleko'}],receipts:[],prices:[],alerts:[]});
  });
  it('sanitizes malformed nested receipt and list records before they reach the UI', () => {
    const db = storage({'taniej-local-v2': JSON.stringify({version:2,items:[{id:'i',name:'Mleko',quantity:'many',offers:[null]}],receipts:[{id:'r',store:'Sklep',lines:[null,{id:'l',name:'Ryż',price:'2.00'},{}]}]})});
    expect(loadLocalSnapshot(db).items).toMatchObject([{id:'i',quantity:1,offers:[]}]);
    expect(loadLocalSnapshot(db).receipts).toMatchObject([{id:'r',total:'',lines:[{id:'l',name:'Ryż',price:'2.00'}]}]);
  });
  it('survives storage access errors and quota failures', () => {
    const broken = {getItem: () => {throw new Error('blocked')}, setItem: () => {throw new Error('quota')}, removeItem: () => {throw new Error('blocked')}};
    expect(loadLocalSnapshot(broken).city).toBe('Warszawa');
    expect(saveLocalSnapshot(broken, {version:2,city:'Warszawa',items:[],saved:[],receipts:[],prices:[],alerts:[]})).toBe(false);
  });
});
