(function initKknAllergy(root) {
  'use strict';

  const definitions = [
    { id: 1, label: '난류', aliases: ['달걀', '계란'], patterns: [/달걀|계란|전란|난백|난황|에그|마요네즈/] },
    { id: 2, label: '우유', aliases: ['유제품'], patterns: [/우유|산양유|분유|유청|카제인|치즈|버터|요구르트|요거트|발효유|생크림|휘핑크림/] },
    { id: 3, label: '메밀', aliases: [], patterns: [/메밀/] },
    { id: 4, label: '땅콩', aliases: ['피넛'], patterns: [/땅콩|피넛/] },
    { id: 5, label: '대두', aliases: ['콩'], patterns: [/대두|콩나물|두부|유부|두유|콩기름|대두유|된장|고추장|청국장|춘장|쌈장|간장|마요네즈/] },
    { id: 6, label: '밀', aliases: [], patterns: [/(?:^|[\s/(,])밀(?:$|[\s/),])|밀가루|통밀|소맥|튀김가루|부침가루|빵가루|하이스가루|자장면|라면|우동|소면|중면|국수|수제비|만두피|또띠아|식빵|모닝빵|파스타|스파게티|마카로니/] },
    { id: 7, label: '고등어', aliases: [], patterns: [/고등어/] },
    { id: 8, label: '게', aliases: [], patterns: [/꽃게|대게|붉은대게|게살|게맛살|(?:^|[\s/(,])게(?:$|[\s/),])/] },
    { id: 9, label: '새우', aliases: [], patterns: [/새우/] },
    { id: 10, label: '돼지고기', aliases: ['돈육'], patterns: [/돼지고기|돈육|돼지족|돼지머리|돼지등뼈|돈가스|돈까스|베이컨|햄(?:$|[\s/(,])|소시지|순대/] },
    { id: 11, label: '복숭아', aliases: [], patterns: [/복숭아/] },
    { id: 12, label: '토마토', aliases: [], patterns: [/토마토|케첩|케찹/] },
    { id: 13, label: '아황산류', aliases: ['이산화황'], patterns: [/아황산|이산화황/] },
    { id: 14, label: '호두', aliases: [], patterns: [/호두/] },
    { id: 15, label: '닭고기', aliases: ['계육'], patterns: [/닭고기|닭가슴|닭다리|닭발|계육|치킨|너겟/] },
    { id: 16, label: '쇠고기', aliases: ['소고기', '우육'], patterns: [/쇠고기|소고기|한우|육우|소사골|사골엑기스|우육/] },
    { id: 17, label: '오징어', aliases: [], patterns: [/오징어/] },
    { id: 18, label: '조개류', aliases: [], patterns: [/조개|굴(?:$|[\s/(,])|전복|홍합|바지락|재첩|꼬막/] },
    { id: 19, label: '잣', aliases: [], patterns: [/잣(?:$|[\s/(,])/] }
  ];

  const byId = new Map(definitions.map(item => [item.id, item]));
  const normalizeText = value => String(value ?? '').normalize('NFKC').replace(/\r\n?/g, '\n');

  function declaredIds(value) {
    const text = normalizeText(value);
    const ids = new Set();
    const pattern = /알레르기(?:\s*정보)?\s*[:：-]?\s*((?:(?:1[0-9]|[1-9])\s*[.,/]\s*)*(?:1[0-9]|[1-9]))/g;
    let match;
    while ((match = pattern.exec(text))) {
      (match[1].match(/\d{1,2}/g) || []).map(Number).filter(id => byId.has(id)).forEach(id => ids.add(id));
    }
    return ids;
  }

  function ingredientText(value) {
    return normalizeText(value).split('\n').filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      return !/\(\s*0(?:[.,]0+)?\s*\)\s*$/.test(trimmed) && !/\s0(?:[.,]0+)?\s*g\s*$/i.test(trimmed);
    }).join('\n');
  }

  function inferFromIngredients(value) {
    const source = ingredientText(value);
    const ids = declaredIds(source);
    definitions.forEach(item => {
      if (item.patterns.some(pattern => pattern.test(source))) ids.add(item.id);
    });
    return definitions.filter(item => ids.has(item.id)).map(item => item.label);
  }

  function normalize(value) {
    const raw = Array.isArray(value) ? value.join(', ') : normalizeText(value).trim();
    if (!raw) return '';
    if (/^(?:(?:1[0-9]|[1-9])\s*[,./\s]\s*)*(?:1[0-9]|[1-9])\.?$/.test(raw)) {
      const ids = (raw.match(/\d{1,2}/g) || []).map(Number);
      return definitions.filter(item => ids.includes(item.id)).map(item => item.label).join(', ');
    }
    const matched = new Set();
    definitions.forEach(item => {
      if ([item.label, ...item.aliases].some(label => raw.includes(label))) matched.add(item.label);
    });
    const knownTokens = new Set(definitions.flatMap(item => [item.label, ...item.aliases]));
    const extras = raw.split(/[,/]+/).map(token => token.trim()).filter(token => token && !knownTokens.has(token) && !/^\d+$/.test(token));
    return [...definitions.filter(item => matched.has(item.label)).map(item => item.label), ...extras].filter((item, index, list) => list.indexOf(item) === index).join(', ');
  }

  root.KKNAllergy = Object.freeze({ definitions, inferFromIngredients, normalize });
})(typeof window !== 'undefined' ? window : globalThis);
