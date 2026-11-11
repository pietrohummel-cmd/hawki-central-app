/* Bateria de testes dos formulários de onboarding da Sofia.
   Roda dentro da própria página (console ou javascript_tool). Não envia nada:
   dl() e fetch() são substituídos por stub durante a execução.

   Uso:  BATERIA()  no formulário essencial
         BATERIA_EXTRAS()  no de extras
   Devolve {total, falhas, falhou[]}. A régua da casa é 2 execuções
   consecutivas sem falha, na página publicada. */
(function () {

function ferramentas(KEYLS) {
  var R = [], _dl = [], _fetch = [];
  var dlOrig = window.dl, fOrig = window.fetch;
  window.dl = function (n) { _dl.push(n) };
  window.fetch = function (u) { _fetch.push(String(u)); return Promise.reject(new Error('stub')) };
  return {
    R: R, _dl: _dl, _fetch: _fetch,
    restaura: function () { window.dl = dlOrig; window.fetch = fOrig },
    ok: function (n, c, d) { R.push([c ? 'PASSOU' : 'FALHOU', n, String(d === undefined ? '' : d)]) },
    zerar: function () {
      try { localStorage.removeItem(KEYLS) } catch (e) {}
      state = { v: 2, a: {}, rep: {}, open: {}, vu: {} }; build(); refresh();
    },
    achaK: function (p) {
      var r = null;
      S.forEach(function (s, si) {
        if (s.rep) return;
        s.q.forEach(function (q, qi) { if (q[0].indexOf(p) === 0) r = 's' + si + '_q' + qi });
      });
      return r;
    },
    abre: function () { S.forEach(function (s, i) { state.open['s' + i] = true }); build(); refresh() },
    bloco: function (p) {
      var a = null;
      document.querySelectorAll('.vu').forEach(function (w) {
        var lb = w.querySelector('label.lb');
        if (lb && lb.textContent.indexOf(p) === 0) a = w;
      });
      return a;
    },
    /* o índice do bloco no DOM muda conforme as seções visíveis: acha pelo título */
    repDe: function (tituloSecao, idx) {
      var blk = null;
      document.querySelectorAll('.blk').forEach(function (b) {
        var h = b.querySelector('.bt h2');
        if (h && h.textContent.indexOf(tituloSecao) === 0) blk = b;
      });
      return blk ? blk.querySelectorAll('.rep')[idx] : null;
    },
    selQtd: function (valor) {
      var s = null;
      document.querySelectorAll('select').forEach(function (e) {
        var lb = e.parentNode.querySelector('label.lb');
        if (!s && lb && lb.textContent.indexOf('Quantas unidades') === 0) s = e;
      });
      if (s) { s.value = valor; s.dispatchEvent(new Event('change')) }
      return !!s;
    },
    fim: function () {
      var f = R.filter(function (r) { return r[0] === 'FALHOU' });
      return { total: R.length, falhas: f.length,
               falhou: f.map(function (r) { return r[1] + ' >>> ' + r[2] }) };
    }
  };
}

function comum(F, cfg) {
  var ok = F.ok, zerar = F.zerar, abre = F.abre, bloco = F.bloco, achaK = F.achaK, selQtd = F.selQtd;
  function clicaRemover(titulo, idx) {
    var rep = F.repDe(titulo, idx), b = null;
    if (!rep) return false;
    rep.querySelectorAll('button').forEach(function (x) { if (x.textContent === 'Remover') b = x });
    if (b) b.click();
    return !!b;
  }
  var U = cfg.secUni;            // título da seção repetível de unidades
  var kNomeU = cfg.kNomeU;       // prefixo da chave do nome da unidade, ex 's1_r'
  function nomeU(r, v) { state.a[kNomeU + r + '_q0'] = v }

  zerar(); abre();
  ok('T1 carga limpa', FALTAM.t === cfg.essenciais && S.length === cfg.secoes, FALTAM.t + '/' + S.length);
  ok('T2 1 unidade sem toggle', document.querySelectorAll('.vubar').length === 0, document.querySelectorAll('.vubar').length);
  ok('T2b pergunta de unidade escondida', document.body.innerText.indexOf('Em qual unidade') < 0 || !cfg.temPergUnidade);
  ok('T3 select "2" pela UI abre 2 fichas', (function () { var a = selQtd('2'); abre(); return a && nUni() === 2 })(), 'nUni=' + nUni());
  ok('T3b toggles aparecem', document.querySelectorAll('.vubar').length === cfg.vu, document.querySelectorAll('.vubar').length + ' esperado ' + cfg.vu);
  nomeU(0, 'Alfa'); nomeU(1, 'Beta'); build(); refresh(); abre();
  ok('T4 nomes das unidades', nomesUni().join('|') === 'Alfa|Beta', nomesUni().join('|'));

  var kP = achaK(cfg.perguntaVU);
  state.a[kP] = 'comum'; build(); refresh(); abre();
  var b = bloco(cfg.perguntaVU).querySelectorAll('.vuopt');
  ok('T5 dois botoes, default igual', b.length === 2 && b[0].className.indexOf('sel') >= 0, b[0].textContent + '/' + b[1].textContent);
  b[1].click(); abre();
  ok('T6 clique liga por unidade', !!state.vu[kP]);
  ok('T6b semeia a resposta comum nas 2', get(kP + '_u0') === 'comum' && get(kP + '_u1') === 'comum', [get(kP + '_u0'), get(kP + '_u1')].join('|'));
  var rot = [].map.call(document.querySelectorAll('.vusub .vun'), function (e) { return e.textContent });
  ok('T6c subcampos com nome da unidade', rot.indexOf('Alfa') >= 0 && rot.indexOf('Beta') >= 0, rot.slice(0, 4).join(','));
  state.a[kP + '_u1'] = 'beta150'; build(); refresh(); abre();
  bloco(cfg.perguntaVU).querySelectorAll('.vuopt')[0].click();
  ok('T7 volta para igual', !state.vu[kP]);
  ok('T7b resposta comum intacta', get(kP) === 'comum', get(kP));
  ok('T7c divergencia guardada', get(kP + '_u1') === 'beta150', get(kP + '_u1'));
  abre(); bloco(cfg.perguntaVU).querySelectorAll('.vuopt')[1].click();
  ok('T7d divergencia volta ao remarcar', get(kP + '_u1') === 'beta150', get(kP + '_u1'));

  state.rep[cfg.sUni] = 3; nomeU(2, 'Gama'); state.a[kP + '_u2'] = 'gama200'; build(); refresh(); abre();
  ok('T8 3 unidades', nUni() === 3, nUni());
  ok('T8b 3 subcampos', bloco(cfg.perguntaVU).querySelectorAll('.vusub').length === 3);
  ok('T8c botao diz 3 unidades', bloco(cfg.perguntaVU).querySelectorAll('.vuopt')[0].textContent.indexOf('3') > 0, bloco(cfg.perguntaVU).querySelectorAll('.vuopt')[0].textContent);
  ok('T9a achou o botao Remover', clicaRemover(U, 2)); abre();
  ok('T9b voltou a 2 unidades', nUni() === 2, nUni());
  ok('T9c sem resposta orfa da removida', get(kP + '_u2') === undefined, 'sobrou ' + JSON.stringify(get(kP + '_u2')));
  ok('T9d ficha da removida limpa', get(kNomeU + '2_q0') === undefined, 'sobrou ' + JSON.stringify(get(kNomeU + '2_q0')));
  state.rep[cfg.sUni] = 3; build(); refresh(); abre();
  ok('T9e unidade nova nasce vazia', !filled(get(kP + '_u2')) && !filled(get(kNomeU + '2_q0')), JSON.stringify([get(kNomeU + '2_q0'), get(kP + '_u2')]));

  /* remover a ficha DO MEIO: a de baixo sobe levando a resposta por unidade */
  zerar(); selQtd('3');
  nomeU(0, 'Alfa'); nomeU(1, 'Beta'); nomeU(2, 'Gama');
  var kP2 = achaK(cfg.perguntaVU); state.vu[kP2] = 1;
  state.a[kP2 + '_u0'] = 'pA'; state.a[kP2 + '_u1'] = 'pB'; state.a[kP2 + '_u2'] = 'pG';
  build(); refresh(); abre();
  ok('T15pre 3 fichas montadas', nUni() === 3 && nomesUni().join('|') === 'Alfa|Beta|Gama', nomesUni().join('|'));
  clicaRemover(U, 1); abre();
  ok('T15a remover a do MEIO deixa 2', nUni() === 2, nUni());
  ok('T15b a de baixo sobe para o indice 1', nomesUni().join('|') === 'Alfa|Gama', nomesUni().join('|'));
  ok('T15c resposta por unidade acompanha', get(kP2 + '_u0') === 'pA' && get(kP2 + '_u1') === 'pG', [get(kP2 + '_u0'), get(kP2 + '_u1')].join('|'));
  ok('T15d nao sobra u2', get(kP2 + '_u2') === undefined, JSON.stringify(get(kP2 + '_u2')));
  ok('T15e md mostra a unidade certa', md().indexOf('**Gama:** pG') > 0);
  ok('T15f "quantas unidades" continua 3 mas NAO reabre a ficha', get(K_QTD) === '3' && nUni() === 2, get(K_QTD) + ' / ' + nUni());
  localStorage.setItem(cfg.KEYLS, JSON.stringify(state));
  state = JSON.parse(localStorage.getItem(cfg.KEYLS)); build(); refresh();
  ok('T15g apos recarregar a ficha removida nao volta', nUni() === 2 && nomesUni().join('|') === 'Alfa|Gama', nUni() + ' ' + nomesUni().join('|'));

  zerar(); selQtd('1'); var base = FALTAM.t;
  selQtd('2'); build(); refresh();
  ok('T10 2 unidades sobe o total de essenciais', FALTAM.t > base, base + '->' + FALTAM.t);
  var kW = achaK(cfg.perguntaVU2), antes = FALTAM.t;
  state.vu[kW] = 1; build(); refresh();
  ok('T10b "diferente" soma 1 pendencia', FALTAM.t === antes + 1, antes + '->' + FALTAM.t);
  state.a[kW + '_u0'] = '1111'; nomeU(0, 'Alfa'); nomeU(1, 'Beta'); build(); refresh();
  var m = md();
  ok('T11 md marca "varia por unidade"', m.indexOf('varia por unidade') > 0);
  ok('T11b md traz o valor da unidade', m.indexOf('**Alfa:** 1111') > 0);
  ok('T11c pendencia cita a unidade vazia', m.indexOf('[Beta]') > 0);
  localStorage.setItem(cfg.KEYLS, JSON.stringify(state));
  var rel = JSON.parse(localStorage.getItem(cfg.KEYLS));
  ok('T12 estado salvo tem vu e rep', !!rel.vu[kW] && rel.rep[cfg.sUni] === 2);

  F._dl.length = 0; F._fetch.length = 0;
  if (!convite()) {
    document.getElementById('bSend').click();
    ok('T13 sem convite baixa e nao chama a rede', F._dl.length === 1 && F._fetch.length === 0, 'dl' + F._dl.length + ' fetch' + F._fetch.length);
  } else {
    ok('T13 pulado (pagina com convite)', true, convite());
  }
  ok('T14 sem rolagem horizontal', document.documentElement.scrollWidth <= window.innerWidth + 2, document.documentElement.scrollWidth + '/' + window.innerWidth);
  return clicaRemover;
}

window.BATERIA = function () {
  var F = ferramentas('hawki_onb_ess');
  var cfg = { KEYLS: 'hawki_onb_ess', essenciais: 64, secoes: 14, vu: 23,
              secUni: 'Unidades', sUni: 's1', kNomeU: 's1_r',
              perguntaVU: 'Tabela de valores', perguntaVU2: 'Número que será conectado',
              temPergUnidade: true };
  var clicaRemover = comum(F, cfg);
  /* exclusivo do essencial: "em qual unidade atende" guarda índice */
  var siP = -1; S.forEach(function (s, i) { if (s.rep && s.t.indexOf('Profissionais') === 0) siP = i });
  var qiU = -1; S[siP].q.forEach(function (q, qi) { if (q[1] === 'u') qiU = qi });
  var kProf = 's' + siP + '_r0_q' + qiU;
  F.zerar(); F.selQtd('2');
  state.a['s1_r0_q0'] = 'Alfa'; state.a['s1_r1_q0'] = 'Beta';
  state.a[kProf] = ['1']; build(); refresh();
  F.ok('T16 marcacao de unidade guarda INDICE', JSON.stringify(get(kProf)) === '["1"]', JSON.stringify(get(kProf)));
  state.a['s1_r1_q0'] = 'Beta Renomeada'; build(); refresh();
  F.ok('T16b renomear a unidade nao desfaz a marcacao', JSON.stringify(get(kProf)) === '["1"]' && md().indexOf('Beta Renomeada') > 0);
  F.abre(); clicaRemover('Unidades', 1); build(); refresh();
  F.ok('T16c remover a unidade marcada limpa a marcacao', JSON.stringify(get(kProf)) === '[]', JSON.stringify(get(kProf)));
  F.zerar(); F.restaura();
  return F.fim();
};

window.BATERIA_EXTRAS = function () {
  var F = ferramentas('hawki_onb_extras');
  /* 18 campos b:1, menos o nome da unidade (mu:1), que some com uma unidade só */
  var cfg = { KEYLS: 'hawki_onb_extras', essenciais: 17, secoes: 12, vu: 33,
              secUni: 'Unidades', sUni: 's1', kNomeU: 's1_r',
              perguntaVU: 'Por qual número esse disparo deve sair',
              perguntaVU2: 'Quantos pacientes novos chamam por mês hoje',
              temPergUnidade: false };
  comum(F, cfg);
  /* exclusivo dos extras: a seção Unidades some quando só existe uma */
  F.zerar(); F.abre();
  var temSecUni = false;
  document.querySelectorAll('.bt h2').forEach(function (h) { if (h.textContent === 'Unidades') temSecUni = true });
  F.ok('T17 com 1 unidade a secao Unidades nao aparece', !temSecUni);
  F.selQtd('2'); F.abre();
  temSecUni = false;
  document.querySelectorAll('.bt h2').forEach(function (h) { if (h.textContent === 'Unidades') temSecUni = true });
  F.ok('T17b com 2 unidades a secao Unidades aparece', temSecUni);
  F.zerar(); F.restaura();
  return F.fim();
};

})();
