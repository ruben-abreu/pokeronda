import {test} from 'node:test';
import assert from 'node:assert/strict';
import {translator} from '../lib/i18n';
import {dateParts} from '../lib/events';
test('English covers navigation, calendar, feedback and installation without changing store names',()=>{
 const t=translator('en');
 assert.equal(t('Todos os jogos'),'All games');
 assert.equal(t('Descarregar .ics'),'Download .ics');
 assert.equal(t('Sugerir uma melhoria'),'Suggest an improvement');
 assert.equal(t('Instalar app'),'Install app');
 assert.equal(t('Versus Gamecenter Lisboa'),'Versus Gamecenter Lisboa');
 assert.equal(translator('pt')('Todos os jogos'),'Todos os jogos');
 assert.equal(dateParts('2026-09-07','en-GB').weekday,'Mon');
 assert.equal(dateParts('2026-09-07','pt-PT').weekday,'segunda');
});
