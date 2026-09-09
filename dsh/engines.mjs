// src/engines/bazi.js
import { Solar } from "lunar-javascript";

// src/engines/ganzhi.js
var GAN_WUXING = { \u7532: "\u6728", \u4E59: "\u6728", \u4E19: "\u706B", \u4E01: "\u706B", \u620A: "\u571F", \u5DF1: "\u571F", \u5E9A: "\u91D1", \u8F9B: "\u91D1", \u58EC: "\u6C34", \u7678: "\u6C34" };
var GAN_YIN_YANG = { \u7532: 1, \u4E59: 0, \u4E19: 1, \u4E01: 0, \u620A: 1, \u5DF1: 0, \u5E9A: 1, \u8F9B: 0, \u58EC: 1, \u7678: 0 };
var ZHI_WUXING = { \u5B50: "\u6C34", \u4E11: "\u571F", \u5BC5: "\u6728", \u536F: "\u6728", \u8FB0: "\u571F", \u5DF3: "\u706B", \u5348: "\u706B", \u672A: "\u571F", \u7533: "\u91D1", \u9149: "\u91D1", \u620C: "\u571F", \u4EA5: "\u6C34" };
var ZHI_YIN_YANG = { \u5B50: 1, \u4E11: 0, \u5BC5: 1, \u536F: 0, \u8FB0: 1, \u5DF3: 0, \u5348: 1, \u672A: 0, \u7533: 1, \u9149: 0, \u620C: 1, \u4EA5: 0 };
var ZHI_ANIMAL = { \u5B50: "\u9F20", \u4E11: "\u725B", \u5BC5: "\u864E", \u536F: "\u5154", \u8FB0: "\u9F99", \u5DF3: "\u86C7", \u5348: "\u9A6C", \u672A: "\u7F8A", \u7533: "\u7334", \u9149: "\u9E21", \u620C: "\u72D7", \u4EA5: "\u732A" };
var SHENG = { \u6728: "\u706B", \u706B: "\u571F", \u571F: "\u91D1", \u91D1: "\u6C34", \u6C34: "\u6728" };
var KE = { \u6728: "\u571F", \u571F: "\u6C34", \u6C34: "\u706B", \u706B: "\u91D1", \u91D1: "\u6728" };
function shiShen(dayGan, target) {
  const dw = GAN_WUXING[dayGan];
  const dy = GAN_YIN_YANG[dayGan];
  const tw = GAN_WUXING[target] || ZHI_WUXING[target];
  const ty = GAN_YIN_YANG[target] !== void 0 ? GAN_YIN_YANG[target] : ZHI_YIN_YANG[target];
  if (!tw) return null;
  const same = dy === ty;
  if (tw === dw) return same ? "\u6BD4\u80A9" : "\u52AB\u8D22";
  if (SHENG[dw] === tw) return same ? "\u98DF\u795E" : "\u4F24\u5B98";
  if (KE[dw] === tw) return same ? "\u504F\u8D22" : "\u6B63\u8D22";
  if (KE[tw] === dw) return same ? "\u4E03\u6740" : "\u6B63\u5B98";
  if (SHENG[tw] === dw) return same ? "\u504F\u5370" : "\u6B63\u5370";
  return null;
}
var SUPPORTIVE = ["\u6BD4\u80A9", "\u52AB\u8D22", "\u504F\u5370", "\u6B63\u5370"];
var shengOf = (w) => SHENG[w];
var keOf = (w) => KE[w];

// src/data/tenGods.js
var TEN_GODS = {
  \u6BD4\u80A9: { group: "\u540C\u6211", plain: "\u628A\u81EA\u5DF1\u5F53\u4F5C\u4E3B\u8981\u4F9D\u9760\uFF0C\u72EC\u7ACB\u3001\u4E0D\u8F7B\u6613\u670D\u4ECE\u5B89\u6392\u3002", w: { drive: 1, stability: 1, social: 0, creation: 0, risk: 0, tension: 0 } },
  \u52AB\u8D22: { group: "\u540C\u6211", plain: "\u884C\u52A8\u529B\u5F3A\u3001\u6562\u4E89\u6562\u62A2\uFF0C\u4F46\u5BB9\u6613\u5728\u8D44\u6E90\u5206\u914D\u4E0A\u8D77\u6469\u64E6\u3002", w: { drive: 2, stability: -1, social: 1, creation: 0, risk: 2, tension: 1 } },
  \u98DF\u795E: { group: "\u6211\u751F", plain: "\u613F\u610F\u8868\u8FBE\u4E0E\u4EAB\u53D7\uFF0C\u521B\u9020\u5E26\u7740\u677E\u5F1B\u611F\uFF0C\u4E0D\u6025\u4E8E\u6C42\u6210\u3002", w: { drive: 0, stability: 1, social: 1, creation: 2, risk: -1, tension: 0 } },
  \u4F24\u5B98: { group: "\u6211\u751F", plain: "\u624D\u534E\u5916\u9732\u3001\u4E0D\u670D\u65E2\u6709\u89C4\u5219\uFF0C\u5BB9\u6613\u5148\u51FA\u5F69\u518D\u51FA\u4E8B\u3002", w: { drive: 1, stability: -2, social: 1, creation: 2, risk: 1, tension: 2 } },
  \u504F\u8D22: { group: "\u6211\u514B", plain: "\u5BF9\u673A\u4F1A\u654F\u611F\u3001\u4EBA\u8109\u6D3B\u7EDC\uFF0C\u94B1\u4E0E\u8D44\u6E90\u6765\u53BB\u90FD\u5FEB\u3002", w: { drive: 1, stability: -1, social: 2, creation: 1, risk: 1, tension: 0 } },
  \u6B63\u8D22: { group: "\u6211\u514B", plain: "\u52A1\u5B9E\u3001\u770B\u91CD\u53EF\u6838\u7B97\u7684\u56DE\u62A5\uFF0C\u9760\u79EF\u7D2F\u800C\u975E\u7206\u53D1\u3002", w: { drive: 1, stability: 2, social: 0, creation: -1, risk: -1, tension: 0 } },
  \u4E03\u6740: { group: "\u514B\u6211", plain: "\u5728\u538B\u529B\u4E0B\u53CD\u800C\u7206\u53D1\uFF0C\u51B3\u65AD\u5FEB\uFF0C\u4E5F\u5BB9\u6613\u628A\u81EA\u5DF1\u903C\u5230\u6781\u9650\u3002", w: { drive: 2, stability: -1, social: 0, creation: 0, risk: 2, tension: 2 } },
  \u6B63\u5B98: { group: "\u514B\u6211", plain: "\u91CD\u89C4\u5219\u4E0E\u8D23\u4EFB\uFF0C\u5728\u660E\u786E\u7684\u7ED3\u6784\u91CC\u6700\u7A33\u5B9A\u3002", w: { drive: 1, stability: 2, social: 0, creation: 0, risk: -2, tension: 1 } },
  \u504F\u5370: { group: "\u751F\u6211", plain: "\u601D\u8DEF\u975E\u5E38\u89C4\u3001\u504F\u5185\u5411\uFF0C\u559C\u6B22\u72EC\u81EA\u6D88\u5316\u95EE\u9898\u3002", w: { drive: -1, stability: 0, social: -2, creation: 1, risk: 0, tension: 2 } },
  \u6B63\u5370: { group: "\u751F\u6211", plain: "\u4F9D\u9760\u5B66\u4E60\u4E0E\u652F\u6301\u7CFB\u7EDF\uFF0C\u6C42\u5B89\u7A33\u3001\u4E0D\u559C\u6B22\u88AB\u63A8\u7740\u8D70\u3002", w: { drive: -1, stability: 2, social: -1, creation: 0, risk: -2, tension: 0 } }
};

// src/engines/bazi.js
var PILLAR_MEANING = {
  \u5E74: "\u65E9\u5E74\u73AF\u5883\u4E0E\u5BB6\u5EAD\u5E95\u8272",
  \u6708: "\u6210\u957F\u671F\u4E0E\u4E3B\u8981\u4E8B\u4E1A\u573A\u57DF",
  \u65E5: "\u81EA\u8EAB\u4E0E\u4EB2\u5BC6\u5173\u7CFB",
  \u65F6: "\u665A\u5E74\u4E0E\u4EA7\u51FA\u3001\u5B50\u5973\u3001\u4F5C\u54C1"
};
var HIDE_W = [1, 0.5, 0.3];
function buildBazi(input) {
  const { date, time, gender = "\u7537", timeUnknown = false } = input;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = timeUnknown ? [12, 0] : (time || "12:00").split(":").map(Number);
  const solar = Solar.fromYmdHms(y, m, d, hh, mm, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  const raw = [
    { pos: "\u5E74", gan: ec.getYearGan(), zhi: ec.getYearZhi(), hide: ec.getYearHideGan(), ssGan: ec.getYearShiShenGan(), ssZhi: ec.getYearShiShenZhi(), naYin: ec.getYearNaYin() },
    { pos: "\u6708", gan: ec.getMonthGan(), zhi: ec.getMonthZhi(), hide: ec.getMonthHideGan(), ssGan: ec.getMonthShiShenGan(), ssZhi: ec.getMonthShiShenZhi(), naYin: ec.getMonthNaYin() },
    { pos: "\u65E5", gan: ec.getDayGan(), zhi: ec.getDayZhi(), hide: ec.getDayHideGan(), ssGan: "\u65E5\u4E3B", ssZhi: ec.getDayShiShenZhi(), naYin: ec.getDayNaYin() },
    { pos: "\u65F6", gan: ec.getTimeGan(), zhi: ec.getTimeZhi(), hide: ec.getTimeHideGan(), ssGan: ec.getTimeShiShenGan(), ssZhi: ec.getTimeShiShenZhi(), naYin: ec.getTimeNaYin() }
  ];
  const pillars = raw.map((p) => ({ ...p, meaning: PILLAR_MEANING[p.pos], wuxingGan: GAN_WUXING[p.gan], wuxingZhi: ZHI_WUXING[p.zhi] }));
  const dayGan = ec.getDayGan();
  const monthZhi = ec.getMonthZhi();
  const wuxing = { \u6728: 0, \u706B: 0, \u571F: 0, \u91D1: 0, \u6C34: 0 };
  const contrib = [];
  pillars.forEach((p) => {
    const mw = p.pos === "\u6708" ? 1.5 : 1;
    wuxing[GAN_WUXING[p.gan]] += mw;
    contrib.push({ from: `${p.pos}\u5E72 ${p.gan}`, wuxing: GAN_WUXING[p.gan], weight: mw });
    p.hide.forEach((g, i) => {
      const w = HIDE_W[i] * mw;
      wuxing[GAN_WUXING[g]] += w;
      contrib.push({ from: `${p.pos}\u652F ${p.zhi} \u85CF ${g}`, wuxing: GAN_WUXING[g], weight: +w.toFixed(2) });
    });
  });
  const wuxingTotal = Object.values(wuxing).reduce((a, b) => a + b, 0);
  const wuxingPct = {};
  Object.keys(wuxing).forEach((k) => {
    wuxingPct[k] = +(wuxing[k] / wuxingTotal * 100).toFixed(1);
    wuxing[k] = +wuxing[k].toFixed(2);
  });
  const tenGods = {};
  const tenGodEvidence = [];
  pillars.forEach((p) => {
    const mw = p.pos === "\u6708" ? 1.5 : 1;
    if (p.pos !== "\u65E5") {
      const s = shiShen(dayGan, p.gan);
      if (s) {
        tenGods[s] = (tenGods[s] || 0) + mw;
        tenGodEvidence.push({ god: s, from: `${p.pos}\u5E72 ${p.gan}`, weight: mw });
      }
    }
    p.hide.forEach((g, i) => {
      const s = shiShen(dayGan, g);
      const w = HIDE_W[i] * mw;
      if (s) {
        tenGods[s] = (tenGods[s] || 0) + w;
        tenGodEvidence.push({ god: s, from: `${p.pos}\u652F ${p.zhi} \u85CF ${g}`, weight: +w.toFixed(2) });
      }
    });
  });
  Object.keys(tenGods).forEach((k) => {
    tenGods[k] = +tenGods[k].toFixed(2);
  });
  const tenGodsSorted = Object.entries(tenGods).sort((a, b) => b[1] - a[1]).map(([god, weight]) => ({ god, weight, ...TEN_GODS[god] }));
  const supportW = tenGodsSorted.filter((t) => SUPPORTIVE.includes(t.god)).reduce((a, b) => a + b.weight, 0) + 1;
  const totalW = tenGodsSorted.reduce((a, b) => a + b.weight, 0) + 1;
  const strengthScore = +(supportW / totalW * 100).toFixed(1);
  const dayWuxing = GAN_WUXING[dayGan];
  const monthWuxing = ZHI_WUXING[monthZhi];
  const deLing = monthWuxing === dayWuxing ? "\u5F97\u4EE4" : shengOf(monthWuxing) === dayWuxing ? "\u5F97\u751F" : keOf(monthWuxing) === dayWuxing ? "\u53D7\u514B" : shengOf(dayWuxing) === monthWuxing ? "\u6CC4\u6C14" : "\u8017\u8EAB";
  const strengthLabel = strengthScore >= 55 ? "\u504F\u5F3A" : strengthScore >= 42 ? "\u4E2D\u548C" : "\u504F\u5F31";
  const SHENG_ME = { \u6728: "\u6C34", \u706B: "\u6728", \u571F: "\u706B", \u91D1: "\u571F", \u6C34: "\u91D1" };
  const favor = strengthLabel === "\u504F\u5F3A" ? [shengOf(dayWuxing), keOf(dayWuxing)] : strengthLabel === "\u504F\u5F31" ? [dayWuxing, SHENG_ME[dayWuxing]] : [dayWuxing, shengOf(dayWuxing)];
  const strength = {
    score: strengthScore,
    label: strengthLabel,
    deLing,
    basis: `\u65E5\u4E3B ${dayGan}\uFF08${dayWuxing}\uFF09\uFF0C\u751F\u4E8E ${monthZhi} \u6708\uFF08${monthWuxing}\uFF09\uFF0C\u6708\u4EE4${deLing}\uFF1B\u5E2E\u8EAB\u529B\u91CF\u5360\u6BD4 ${strengthScore}%\u3002`,
    favor
  };
  const genderCode = gender === "\u5973" ? 0 : 1;
  const yun = ec.getYun(genderCode);
  const daYunRaw = yun.getDaYun();
  const daYun = daYunRaw.filter((dy) => dy.getGanZhi()).map((dy) => {
    const gz = dy.getGanZhi();
    const g = gz[0], z = gz[1];
    return {
      ganZhi: gz,
      gan: g,
      zhi: z,
      startYear: dy.getStartYear(),
      endYear: dy.getEndYear(),
      startAge: dy.getStartAge(),
      endAge: dy.getEndAge(),
      shiShenGan: shiShen(dayGan, g),
      shiShenZhi: shiShen(dayGan, z),
      wuxing: [GAN_WUXING[g], ZHI_WUXING[z]]
    };
  });
  const startInfo = { year: yun.getStartYear(), month: yun.getStartMonth(), day: yun.getStartDay() };
  return {
    system: "bazi",
    input: { date, time: timeUnknown ? null : time, gender, timeUnknown },
    solar: { y, m, d, hh, mm },
    lunarText: `${lunar.getYearInChinese()}\u5E74 ${lunar.getMonthInChinese()}\u6708 ${lunar.getDayInChinese()}`,
    animal: ZHI_ANIMAL[ec.getYearZhi()],
    pillars,
    dayMaster: { gan: dayGan, wuxing: dayWuxing, yinYang: GAN_YIN_YANG[dayGan] ? "\u9633" : "\u9634" },
    taiYuan: ec.getTaiYuan(),
    mingGong: ec.getMingGong(),
    wuxing,
    wuxingPct,
    wuxingContrib: contrib,
    tenGods: tenGodsSorted,
    tenGodEvidence,
    strength,
    daYun,
    startInfo,
    dayYi: lunar.getDayYi(),
    dayJi: lunar.getDayJi()
  };
}
function baziAtYear(bazi, year) {
  const dy = bazi.daYun.find((d) => year >= d.startYear && year <= d.endYear) || null;
  const solar = Solar.fromYmd(year, 6, 1);
  const gz = solar.getLunar().getYearInGanZhi();
  const g = gz[0], z = gz[1];
  return {
    daYun: dy,
    liuNian: {
      year,
      ganZhi: gz,
      gan: g,
      zhi: z,
      shiShenGan: shiShen(bazi.dayMaster.gan, g),
      shiShenZhi: shiShen(bazi.dayMaster.gan, z),
      wuxing: [GAN_WUXING[g], ZHI_WUXING[z]]
    }
  };
}

// src/engines/ziwei.js
import { astro } from "iztro";

// src/data/stars.js
var MAJOR_STARS = {
  \u7D2B\u5FAE: { plain: "\u4E60\u60EF\u7AD9\u5728\u4E3B\u5BFC\u4F4D\u7F6E\uFF0C\u5BF9\u5C40\u9762\u6709\u638C\u63A7\u6B32\uFF0C\u4E5F\u5728\u610F\u4F53\u9762\u3002", w: { drive: 1, stability: 1, social: 1, creation: 0, risk: 0, tension: 1 } },
  \u5929\u673A: { plain: "\u601D\u8651\u5FEB\u3001\u65B9\u6848\u591A\uFF0C\u5BB9\u6613\u60F3\u5F97\u6BD4\u505A\u5F97\u591A\u3002", w: { drive: 0, stability: -1, social: 0, creation: 2, risk: 0, tension: 2 } },
  \u592A\u9633: { plain: "\u613F\u610F\u4ED8\u51FA\u4E0E\u7167\u4EAE\u4ED6\u4EBA\uFF0C\u5BF9\u5916\u8868\u8FBE\u5F3A\uFF0C\u4E5F\u5BB9\u6613\u8FC7\u52B3\u3002", w: { drive: 2, stability: 0, social: 2, creation: 1, risk: 0, tension: 1 } },
  \u6B66\u66F2: { plain: "\u52A1\u5B9E\u3001\u6267\u884C\u786C\uFF0C\u5BF9\u8D44\u6E90\u4E0E\u7ED3\u679C\u654F\u611F\uFF0C\u60C5\u7EEA\u8868\u8FBE\u504F\u5C11\u3002", w: { drive: 2, stability: 2, social: -1, creation: -1, risk: 0, tension: 0 } },
  \u5929\u540C: { plain: "\u8FFD\u6C42\u8212\u9002\u4E0E\u5173\u7CFB\u548C\u8C10\uFF0C\u6297\u62D2\u88AB\u903C\u7740\u6539\u53D8\u3002", w: { drive: -1, stability: 2, social: 1, creation: 0, risk: -2, tension: 0 } },
  \u5EC9\u8D1E: { plain: "\u539F\u5219\u4E0E\u6B32\u671B\u5E76\u5B58\uFF0C\u505A\u4E8B\u6709\u5F3A\u70C8\u7684\u4E2A\u4EBA\u98CE\u683C\u3002", w: { drive: 1, stability: -1, social: 0, creation: 1, risk: 1, tension: 2 } },
  \u5929\u5E9C: { plain: "\u5B88\u6210\u4E0E\u79EF\u7D2F\u578B\uFF0C\u559C\u6B22\u628A\u5BB6\u5E95\u6512\u539A\u518D\u52A8\u3002", w: { drive: 0, stability: 2, social: 0, creation: -1, risk: -2, tension: 0 } },
  \u592A\u9634: { plain: "\u7EC6\u817B\u3001\u91CD\u5185\u5728\u611F\u53D7\uFF0C\u504F\u597D\u5728\u5E55\u540E\u7ECF\u8425\u3002", w: { drive: -1, stability: 1, social: -1, creation: 1, risk: -1, tension: 1 } },
  \u8D2A\u72FC: { plain: "\u6B32\u671B\u4E0E\u597D\u5947\u5FC3\u90FD\u5F3A\uFF0C\u5174\u8DA3\u5E7F\u3001\u64C5\u957F\u4EA4\u9645\u4E0E\u8F6C\u8EAB\u3002", w: { drive: 1, stability: -2, social: 2, creation: 2, risk: 2, tension: 1 } },
  \u5DE8\u95E8: { plain: "\u5584\u4E8E\u5206\u6790\u4E0E\u8D28\u7591\uFF0C\u9760\u8BF4\u8BDD\u5403\u996D\uFF0C\u4E5F\u5BB9\u6613\u56E0\u8BF4\u8BDD\u8D77\u4E89\u8BAE\u3002", w: { drive: 0, stability: -1, social: 1, creation: 1, risk: 0, tension: 2 } },
  \u5929\u76F8: { plain: "\u534F\u8C03\u4E0E\u8F85\u4F50\u578B\uFF0C\u8BB2\u7A76\u5F97\u4F53\uFF0C\u503E\u5411\u914D\u5408\u800C\u975E\u72EC\u65AD\u3002", w: { drive: 0, stability: 2, social: 1, creation: 0, risk: -1, tension: 0 } },
  \u5929\u6881: { plain: "\u6709\u8001\u6210\u4E0E\u627F\u62C5\u7684\u4E00\u9762\uFF0C\u4E60\u60EF\u66FF\u4EBA\u5584\u540E\u3002", w: { drive: 0, stability: 2, social: 0, creation: 0, risk: -1, tension: 1 } },
  \u4E03\u6740: { plain: "\u679C\u65AD\u3001\u8BF4\u505A\u5C31\u505A\uFF0C\u503E\u5411\u4EE5\u884C\u52A8\u6253\u7834\u50F5\u5C40\u3002", w: { drive: 2, stability: -2, social: 0, creation: 0, risk: 2, tension: 1 } },
  \u7834\u519B: { plain: "\u5148\u7834\u540E\u7ACB\uFF0C\u613F\u610F\u63A8\u7FFB\u91CD\u6765\uFF0C\u8FC7\u7A0B\u6D88\u8017\u5927\u3002", w: { drive: 2, stability: -2, social: 0, creation: 2, risk: 2, tension: 2 } }
};
var MUTAGEN = {
  \u7984: { plain: "\u8D44\u6E90\u4E0E\u987A\u7545\u7684\u4E00\u9762\u88AB\u653E\u5927", tone: "positive" },
  \u6743: { plain: "\u638C\u63A7\u4E0E\u63A8\u52A8\u7684\u4E00\u9762\u88AB\u653E\u5927", tone: "positive" },
  \u79D1: { plain: "\u58F0\u540D\u4E0E\u88AB\u770B\u89C1\u7684\u4E00\u9762\u88AB\u653E\u5927", tone: "positive" },
  \u5FCC: { plain: "\u6267\u7740\u4E0E\u5361\u70B9\u7684\u4E00\u9762\u88AB\u653E\u5927", tone: "caution" }
};
var PALACE_DOMAIN = {
  \u547D\u5BAB: "self",
  \u5144\u5F1F: "relation",
  \u592B\u59BB: "relation",
  \u5B50\u5973: "creation",
  \u8D22\u5E1B: "wealth",
  \u75BE\u5384: "body",
  \u8FC1\u79FB: "move",
  \u4EC6\u5F79: "relation",
  \u5B98\u7984: "career",
  \u7530\u5B85: "wealth",
  \u798F\u5FB7: "body",
  \u7236\u6BCD: "relation"
};
var DOMAINS = [
  { key: "career", label: "\u4E8B\u4E1A", color: "var(--jade)" },
  { key: "wealth", label: "\u8D22\u5BCC", color: "var(--gold)" },
  { key: "relation", label: "\u5173\u7CFB", color: "var(--azure)" },
  { key: "move", label: "\u8FC1\u79FB", color: "var(--violet)" },
  { key: "creation", label: "\u521B\u9020", color: "var(--wx-tu)" },
  { key: "body", label: "\u8EAB\u5FC3", color: "var(--cinnabar)" }
];

// src/engines/ziwei.js
function timeToIndex(time) {
  if (!time) return 6;
  const [h] = time.split(":").map(Number);
  if (h >= 23) return 12;
  return Math.floor((h + 1) / 2);
}
function buildZiwei(input) {
  const { date, time, gender = "\u7537", timeUnknown = false } = input;
  const [y, m, d] = date.split("-").map(Number);
  const timeIndex = timeToIndex(timeUnknown ? null : time);
  const a = astro.bySolar(`${y}-${m}-${d}`, timeIndex, gender, true, "zh-CN");
  const palaces = a.palaces.map((p, i) => ({
    index: i,
    name: p.name,
    stem: p.heavenlyStem,
    branch: p.earthlyBranch,
    isSoul: p.name === "\u547D\u5BAB",
    isBody: p.isBodyPalace,
    domain: PALACE_DOMAIN[p.name] || "self",
    majorStars: p.majorStars.map((s) => ({ name: s.name, brightness: s.brightness, mutagen: s.mutagen, isMajor: !!MAJOR_STARS[s.name] })),
    minorStars: p.minorStars.map((s) => ({ name: s.name, brightness: s.brightness, mutagen: s.mutagen })),
    adjectiveStars: p.adjectiveStars.map((s) => s.name),
    decadalRange: p.decadal.range,
    decadalStem: p.decadal.heavenlyStem,
    decadalBranch: p.decadal.earthlyBranch
  }));
  const soulPalace = palaces.find((p) => p.isSoul);
  const soulMajors = soulPalace.majorStars.filter((s) => MAJOR_STARS[s.name]);
  let borrowedFrom = null;
  let effectiveMajors = soulMajors;
  if (!soulMajors.length) {
    const opposite = palaces[(soulPalace.index + 6) % 12];
    effectiveMajors = opposite.majorStars.filter((s) => MAJOR_STARS[s.name]);
    borrowedFrom = opposite.name;
  }
  return {
    system: "ziwei",
    input: { date, time: timeUnknown ? null : time, gender, timeUnknown, timeIndex },
    fiveElementsClass: a.fiveElementsClass,
    soul: a.soul,
    body: a.body,
    lunarDate: a.lunarDate,
    chineseDate: a.chineseDate,
    zodiac: a.zodiac,
    sign: a.sign,
    palaces,
    soulPalace,
    soulMajors: effectiveMajors,
    borrowedFrom,
    _astro: a
  };
}
function ziweiAtYear(ziwei, year, month = 6, day = 15) {
  const h = ziwei._astro.horoscope(`${year}-${month}-${day}`);
  const decadalPalace = ziwei.palaces[h.decadal.index];
  const yearlyPalace = ziwei.palaces[h.yearly.index];
  return {
    year,
    decadal: {
      index: h.decadal.index,
      palaceName: decadalPalace.name,
      range: decadalPalace.decadalRange,
      ganZhi: h.decadal.heavenlyStem + h.decadal.earthlyBranch,
      mutagen: h.decadal.mutagen,
      // 大限命宫落在本命的哪个宫位 -> 该阶段的人生重心
      palaceNames: h.decadal.palaceNames
    },
    yearly: {
      index: h.yearly.index,
      palaceName: yearlyPalace.name,
      ganZhi: h.yearly.heavenlyStem + h.yearly.earthlyBranch,
      mutagen: h.yearly.mutagen,
      palaceNames: h.yearly.palaceNames
    }
  };
}
function locateMutagens(ziwei, mutagenStars) {
  const labels = ["\u7984", "\u6743", "\u79D1", "\u5FCC"];
  return (mutagenStars || []).map((starName, i) => {
    const palace = ziwei.palaces.find(
      (p) => p.majorStars.some((s) => s.name === starName) || p.minorStars.some((s) => s.name === starName)
    );
    return {
      type: labels[i],
      star: starName,
      palace: palace ? palace.name : null,
      domain: palace ? palace.domain : null,
      meaning: MUTAGEN[labels[i]]
    };
  }).filter((x) => x.palace);
}

// src/data/geo.js
var C = (n, lng, lat, tz = 8) => ({ n, lng, lat, tz });
var PLACES = [
  C("\u5317\u4EAC", 116.4, 39.9),
  C("\u5929\u6D25", 117.2, 39.1),
  C("\u4E0A\u6D77", 121.5, 31.2),
  C("\u91CD\u5E86", 106.5, 29.6),
  C("\u77F3\u5BB6\u5E84", 114.5, 38),
  C("\u5510\u5C71", 118.2, 39.6),
  C("\u4FDD\u5B9A", 115.5, 38.9),
  C("\u90AF\u90F8", 114.5, 36.6),
  C("\u79E6\u7687\u5C9B", 119.6, 39.9),
  C("\u5F20\u5BB6\u53E3", 114.9, 40.8),
  C("\u5ECA\u574A", 116.7, 39.5),
  C("\u6CA7\u5DDE", 116.8, 38.3),
  C("\u90A2\u53F0", 114.5, 37.1),
  C("\u8861\u6C34", 115.7, 37.7),
  C("\u627F\u5FB7", 117.9, 40.9),
  C("\u592A\u539F", 112.5, 37.9),
  C("\u5927\u540C", 113.3, 40.1),
  C("\u8FD0\u57CE", 111, 35),
  C("\u4E34\u6C7E", 111.5, 36.1),
  C("\u957F\u6CBB", 113.1, 36.2),
  C("\u664B\u4E2D", 112.7, 37.7),
  C("\u547C\u548C\u6D69\u7279", 111.7, 40.8),
  C("\u5305\u5934", 109.8, 40.7),
  C("\u9102\u5C14\u591A\u65AF", 109.8, 39.6),
  C("\u8D64\u5CF0", 118.9, 42.3),
  C("\u901A\u8FBD", 122.2, 43.6),
  C("\u547C\u4F26\u8D1D\u5C14", 119.8, 49.2),
  C("\u6C88\u9633", 123.4, 41.8),
  C("\u5927\u8FDE", 121.6, 38.9),
  C("\u978D\u5C71", 123, 41.1),
  C("\u629A\u987A", 123.9, 41.9),
  C("\u9526\u5DDE", 121.1, 41.1),
  C("\u8425\u53E3", 122.2, 40.7),
  C("\u4E39\u4E1C", 124.4, 40.1),
  C("\u957F\u6625", 125.3, 43.9),
  C("\u5409\u6797\u5E02", 126.6, 43.8),
  C("\u5EF6\u5409", 129.5, 42.9),
  C("\u56DB\u5E73", 124.4, 43.2),
  C("\u54C8\u5C14\u6EE8", 126.6, 45.8),
  C("\u9F50\u9F50\u54C8\u5C14", 124, 47.4),
  C("\u5927\u5E86", 125.1, 46.6),
  C("\u7261\u4E39\u6C5F", 129.6, 44.6),
  C("\u4F73\u6728\u65AF", 130.3, 46.8),
  C("\u5357\u4EAC", 118.8, 32.1),
  C("\u82CF\u5DDE", 120.6, 31.3),
  C("\u65E0\u9521", 120.3, 31.6),
  C("\u5E38\u5DDE", 119.9, 31.8),
  C("\u5357\u901A", 120.9, 32),
  C("\u5F90\u5DDE", 117.2, 34.3),
  C("\u626C\u5DDE", 119.4, 32.4),
  C("\u9547\u6C5F", 119.4, 32.2),
  C("\u76D0\u57CE", 120.2, 33.3),
  C("\u6CF0\u5DDE", 119.9, 32.5),
  C("\u6DEE\u5B89", 119, 33.6),
  C("\u8FDE\u4E91\u6E2F", 119.2, 34.6),
  C("\u5BBF\u8FC1", 118.3, 33.9),
  C("\u676D\u5DDE", 120.2, 30.3),
  C("\u5B81\u6CE2", 121.5, 29.9),
  C("\u6E29\u5DDE", 120.7, 28),
  C("\u5609\u5174", 120.8, 30.7),
  C("\u6E56\u5DDE", 120.1, 30.9),
  C("\u7ECD\u5174", 120.6, 30),
  C("\u91D1\u534E", 119.6, 29.1),
  C("\u8862\u5DDE", 118.9, 28.9),
  C("\u53F0\u5DDE", 121.4, 28.7),
  C("\u4E3D\u6C34", 119.9, 28.5),
  C("\u821F\u5C71", 122.2, 30),
  C("\u4E49\u4E4C", 120.1, 29.3),
  C("\u5408\u80A5", 117.3, 31.9),
  C("\u829C\u6E56", 118.4, 31.3),
  C("\u868C\u57E0", 117.4, 32.9),
  C("\u961C\u9633", 115.8, 32.9),
  C("\u5B89\u5E86", 117, 30.5),
  C("\u9A6C\u978D\u5C71", 118.5, 31.7),
  C("\u6EC1\u5DDE", 118.3, 32.3),
  C("\u516D\u5B89", 116.5, 31.7),
  C("\u5BBF\u5DDE", 116.9, 33.6),
  C("\u4EB3\u5DDE", 115.8, 33.8),
  C("\u798F\u5DDE", 119.3, 26.1),
  C("\u53A6\u95E8", 118.1, 24.5),
  C("\u6CC9\u5DDE", 118.6, 24.9),
  C("\u6F33\u5DDE", 117.6, 24.5),
  C("\u8386\u7530", 119, 25.4),
  C("\u5B81\u5FB7", 119.5, 26.7),
  C("\u9F99\u5CA9", 117, 25.1),
  C("\u4E09\u660E", 117.6, 26.3),
  C("\u5357\u5E73", 118.2, 26.6),
  C("\u5357\u660C", 115.9, 28.7),
  C("\u8D63\u5DDE", 114.9, 25.8),
  C("\u4E5D\u6C5F", 116, 29.7),
  C("\u4E0A\u9976", 117.9, 28.5),
  C("\u5409\u5B89", 115, 27.1),
  C("\u5B9C\u6625", 114.4, 27.8),
  C("\u629A\u5DDE", 116.4, 28),
  C("\u666F\u5FB7\u9547", 117.2, 29.3),
  C("\u6D4E\u5357", 117, 36.7),
  C("\u9752\u5C9B", 120.4, 36.1),
  C("\u70DF\u53F0", 121.4, 37.5),
  C("\u6F4D\u574A", 119.2, 36.7),
  C("\u4E34\u6C82", 118.4, 35.1),
  C("\u6DC4\u535A", 118.1, 36.8),
  C("\u6D4E\u5B81", 116.6, 35.4),
  C("\u6CF0\u5B89", 117.1, 36.2),
  C("\u5A01\u6D77", 122.1, 37.5),
  C("\u65E5\u7167", 119.5, 35.4),
  C("\u5FB7\u5DDE", 116.4, 37.4),
  C("\u804A\u57CE", 116, 36.5),
  C("\u83CF\u6CFD", 115.5, 35.2),
  C("\u67A3\u5E84", 117.3, 34.8),
  C("\u4E1C\u8425", 118.7, 37.4),
  C("\u6EE8\u5DDE", 118, 37.4),
  C("\u90D1\u5DDE", 113.6, 34.7),
  C("\u6D1B\u9633", 112.5, 34.6),
  C("\u5F00\u5C01", 114.3, 34.8),
  C("\u5357\u9633", 112.5, 33),
  C("\u65B0\u4E61", 113.9, 35.3),
  C("\u8BB8\u660C", 113.8, 34),
  C("\u5468\u53E3", 114.7, 33.6),
  C("\u4FE1\u9633", 114.1, 32.1),
  C("\u5546\u4E18", 115.7, 34.4),
  C("\u9A7B\u9A6C\u5E97", 114, 33),
  C("\u5B89\u9633", 114.4, 36.1),
  C("\u5E73\u9876\u5C71", 113.2, 33.8),
  C("\u7126\u4F5C", 113.2, 35.2),
  C("\u6FEE\u9633", 115, 35.8),
  C("\u6F2F\u6CB3", 114, 33.6),
  C("\u4E09\u95E8\u5CE1", 111.2, 34.8),
  C("\u6B66\u6C49", 114.3, 30.6),
  C("\u5B9C\u660C", 111.3, 30.7),
  C("\u8944\u9633", 112.1, 32),
  C("\u8346\u5DDE", 112.2, 30.3),
  C("\u9EC4\u5188", 114.9, 30.5),
  C("\u5341\u5830", 110.8, 32.6),
  C("\u5B5D\u611F", 113.9, 31),
  C("\u8346\u95E8", 112.2, 31),
  C("\u9EC4\u77F3", 115, 30.2),
  C("\u54B8\u5B81", 114.3, 29.8),
  C("\u6069\u65BD", 109.5, 30.3),
  C("\u957F\u6C99", 113, 28.2),
  C("\u682A\u6D32", 113.1, 27.8),
  C("\u6E58\u6F6D", 112.9, 27.8),
  C("\u8861\u9633", 112.6, 26.9),
  C("\u5CB3\u9633", 113.1, 29.4),
  C("\u5E38\u5FB7", 111.7, 29),
  C("\u90F4\u5DDE", 113, 25.8),
  C("\u90B5\u9633", 111.5, 27.2),
  C("\u6C38\u5DDE", 111.6, 26.4),
  C("\u6000\u5316", 110, 27.6),
  C("\u5A04\u5E95", 112, 27.7),
  C("\u76CA\u9633", 112.4, 28.6),
  C("\u5F20\u5BB6\u754C", 110.5, 29.1),
  C("\u5E7F\u5DDE", 113.3, 23.1),
  C("\u6DF1\u5733", 114.1, 22.5),
  C("\u4E1C\u839E", 113.8, 23),
  C("\u4F5B\u5C71", 113.1, 23),
  C("\u73E0\u6D77", 113.6, 22.3),
  C("\u4E2D\u5C71", 113.4, 22.5),
  C("\u60E0\u5DDE", 114.4, 23.1),
  C("\u6C55\u5934", 116.7, 23.4),
  C("\u6C5F\u95E8", 113.1, 22.6),
  C("\u6E5B\u6C5F", 110.4, 21.3),
  C("\u8302\u540D", 110.9, 21.7),
  C("\u8087\u5E86", 112.5, 23),
  C("\u63ED\u9633", 116.4, 23.5),
  C("\u6F6E\u5DDE", 116.6, 23.7),
  C("\u6885\u5DDE", 116.1, 24.3),
  C("\u97F6\u5173", 113.6, 24.8),
  C("\u6E05\u8FDC", 113, 23.7),
  C("\u6C55\u5C3E", 115.4, 22.8),
  C("\u6CB3\u6E90", 114.7, 23.7),
  C("\u9633\u6C5F", 111.9, 21.9),
  C("\u4E91\u6D6E", 112, 22.9),
  C("\u5357\u5B81", 108.4, 22.8),
  C("\u67F3\u5DDE", 109.4, 24.3),
  C("\u6842\u6797", 110.3, 25.3),
  C("\u7389\u6797", 110.2, 22.6),
  C("\u68A7\u5DDE", 111.3, 23.5),
  C("\u5317\u6D77", 109.1, 21.5),
  C("\u94A6\u5DDE", 108.6, 21.9),
  C("\u767E\u8272", 106.6, 23.9),
  C("\u8D35\u6E2F", 109.6, 23.1),
  C("\u6D77\u53E3", 110.3, 20),
  C("\u4E09\u4E9A", 109.5, 18.3),
  C("\u6210\u90FD", 104.1, 30.7),
  C("\u7EF5\u9633", 104.7, 31.5),
  C("\u5FB7\u9633", 104.4, 31.1),
  C("\u5357\u5145", 106.1, 30.8),
  C("\u5B9C\u5BBE", 104.6, 28.8),
  C("\u6CF8\u5DDE", 105.4, 28.9),
  C("\u4E50\u5C71", 103.8, 29.6),
  C("\u8FBE\u5DDE", 107.5, 31.2),
  C("\u5185\u6C5F", 105.1, 29.6),
  C("\u81EA\u8D21", 104.8, 29.3),
  C("\u9042\u5B81", 105.6, 30.5),
  C("\u7709\u5C71", 103.8, 30.1),
  C("\u5E7F\u5143", 105.8, 32.4),
  C("\u6500\u679D\u82B1", 101.7, 26.6),
  C("\u8D44\u9633", 104.6, 30.1),
  C("\u5E7F\u5B89", 106.6, 30.5),
  C("\u96C5\u5B89", 103, 30),
  C("\u897F\u660C", 102.3, 27.9),
  C("\u8D35\u9633", 106.6, 26.6),
  C("\u9075\u4E49", 106.9, 27.7),
  C("\u516D\u76D8\u6C34", 104.8, 26.6),
  C("\u5B89\u987A", 105.9, 26.3),
  C("\u6BD5\u8282", 105.3, 27.3),
  C("\u94DC\u4EC1", 109.2, 27.7),
  C("\u51EF\u91CC", 107.9, 26.6),
  C("\u5174\u4E49", 104.9, 25.1),
  C("\u6606\u660E", 102.7, 25),
  C("\u66F2\u9756", 103.8, 25.5),
  C("\u7389\u6EAA", 102.5, 24.4),
  C("\u5927\u7406", 100.2, 25.6),
  C("\u4E3D\u6C5F", 100.2, 26.9),
  C("\u662D\u901A", 103.7, 27.3),
  C("\u7EA2\u6CB3", 103.4, 23.4),
  C("\u4FDD\u5C71", 99.2, 25.1),
  C("\u897F\u53CC\u7248\u7EB3", 100.8, 22),
  C("\u666E\u6D31", 101, 22.8),
  C("\u62C9\u8428", 91.1, 29.7),
  C("\u65E5\u5580\u5219", 88.9, 29.3),
  C("\u6797\u829D", 94.4, 29.7),
  C("\u897F\u5B89", 108.9, 34.3),
  C("\u54B8\u9633", 108.7, 34.3),
  C("\u5B9D\u9E21", 107.2, 34.4),
  C("\u6E2D\u5357", 109.5, 34.5),
  C("\u6C49\u4E2D", 107, 33.1),
  C("\u6986\u6797", 109.7, 38.3),
  C("\u5EF6\u5B89", 109.5, 36.6),
  C("\u5B89\u5EB7", 109, 32.7),
  C("\u5546\u6D1B", 110, 33.9),
  C("\u94DC\u5DDD", 109, 35.1),
  C("\u5170\u5DDE", 103.8, 36.1),
  C("\u5929\u6C34", 105.7, 34.6),
  C("\u767D\u94F6", 104.1, 36.5),
  C("\u9152\u6CC9", 98.5, 39.7),
  C("\u5F20\u6396", 100.4, 38.9),
  C("\u6B66\u5A01", 102.6, 37.9),
  C("\u5E73\u51C9", 106.7, 35.5),
  C("\u5E86\u9633", 107.6, 35.7),
  C("\u5B9A\u897F", 104.6, 35.6),
  C("\u9647\u5357", 105, 33.4),
  C("\u5609\u5CEA\u5173", 98.3, 39.8),
  C("\u897F\u5B81", 101.8, 36.6),
  C("\u683C\u5C14\u6728", 94.9, 36.4),
  C("\u6D77\u4E1C", 102.1, 36.5),
  C("\u94F6\u5DDD", 106.2, 38.5),
  C("\u5434\u5FE0", 106.2, 38),
  C("\u56FA\u539F", 106.3, 36),
  C("\u77F3\u5634\u5C71", 106.4, 39),
  C("\u4E4C\u9C81\u6728\u9F50", 87.6, 43.8),
  C("\u5580\u4EC0", 76, 39.5),
  C("\u4F0A\u7281", 81.3, 43.9),
  C("\u4F0A\u5B81", 81.3, 43.9),
  C("\u5E93\u5C14\u52D2", 86.2, 41.7),
  C("\u963F\u514B\u82CF", 80.3, 41.2),
  C("\u54C8\u5BC6", 93.5, 42.8),
  C("\u5410\u9C81\u756A", 89.2, 42.9),
  C("\u514B\u62C9\u739B\u4F9D", 84.9, 45.6),
  C("\u548C\u7530", 79.9, 37.1),
  C("\u77F3\u6CB3\u5B50", 86, 44.3),
  C("\u660C\u5409", 87.3, 44),
  C("\u9999\u6E2F", 114.2, 22.3),
  C("\u6FB3\u95E8", 113.5, 22.2),
  C("\u53F0\u5317", 121.5, 25),
  C("\u9AD8\u96C4", 120.3, 22.6),
  C("\u53F0\u4E2D", 120.7, 24.1),
  C("\u53F0\u5357", 120.2, 23),
  C("\u65B0\u52A0\u5761", 103.8, 1.35),
  C("\u5409\u9686\u5761", 101.7, 3.1),
  C("\u4E1C\u4EAC", 139.7, 35.7, 9),
  C("\u5927\u962A", 135.5, 34.7, 9),
  C("\u9996\u5C14", 127, 37.6, 9),
  C("\u66FC\u8C37", 100.5, 13.8, 7),
  C("\u8FEA\u62DC", 55.3, 25.2, 4),
  C("\u4EAC\u90FD", 135.8, 35, 9),
  C("\u672D\u5E4C", 141.4, 43.1, 9),
  C("\u798F\u5188", 130.4, 33.6, 9),
  C("\u51B2\u7EF3", 127.7, 26.2, 9),
  C("\u91DC\u5C71", 129.1, 35.2, 9),
  C("\u6D4E\u5DDE", 126.5, 33.5, 9),
  C("\u6CB3\u5185", 105.8, 21, 7),
  C("\u80E1\u5FD7\u660E\u5E02", 106.7, 10.8, 7),
  C("\u6E05\u8FC8", 99, 18.8, 7),
  C("\u91D1\u8FB9", 104.9, 11.6, 7),
  C("\u96C5\u52A0\u8FBE", 106.8, -6.2, 7),
  C("\u5DF4\u5398\u5C9B", 115.2, -8.4, 8),
  C("\u9A6C\u5C3C\u62C9", 121, 14.6, 8),
  C("\u69DF\u57CE", 100.3, 5.4),
  C("\u52A0\u5FB7\u6EE1\u90FD", 85.3, 27.7, 5.75),
  C("\u65B0\u5FB7\u91CC", 77.2, 28.6, 5.5),
  C("\u5B5F\u4E70", 72.9, 19.1, 5.5),
  C("\u4F0A\u65AF\u5766\u5E03\u5C14", 29, 41, 3),
  C("\u5F00\u7F57", 31.2, 30, 2),
  C("\u5185\u7F57\u6BD5", 36.8, -1.3, 3),
  C("\u5F00\u666E\u6566", 18.4, -33.9, 2),
  C("\u83AB\u65AF\u79D1", 37.6, 55.8, 3),
  C("\u5723\u5F7C\u5F97\u5821", 30.3, 59.9, 3),
  C("\u8D6B\u5C14\u8F9B\u57FA", 24.9, 60.2, 2),
  C("\u65AF\u5FB7\u54E5\u5C14\u6469", 18.1, 59.3, 1),
  C("\u54E5\u672C\u54C8\u6839", 12.6, 55.7, 1),
  C("\u5965\u65AF\u9646", 10.7, 59.9, 1),
  C("\u96F7\u514B\u96C5\u672A\u514B", -21.9, 64.1, 0),
  C("\u963F\u59C6\u65AF\u7279\u4E39", 4.9, 52.4, 1),
  C("\u5E03\u9C81\u585E\u5C14", 4.4, 50.8, 1),
  C("\u82CF\u9ECE\u4E16", 8.5, 47.4, 1),
  C("\u65E5\u5185\u74E6", 6.1, 46.2, 1),
  C("\u7EF4\u4E5F\u7EB3", 16.4, 48.2, 1),
  C("\u5E03\u62C9\u683C", 14.4, 50.1, 1),
  C("\u5E03\u8FBE\u4F69\u65AF", 19, 47.5, 1),
  C("\u534E\u6C99", 21, 52.2, 1),
  C("\u7C73\u5170", 9.2, 45.5, 1),
  C("\u7F57\u9A6C", 12.5, 41.9, 1),
  C("\u5DF4\u585E\u7F57\u90A3", 2.2, 41.4, 1),
  C("\u9A6C\u5FB7\u91CC", -3.7, 40.4, 1),
  C("\u91CC\u65AF\u672C", -9.1, 38.7, 0),
  C("\u96C5\u5178", 23.7, 38, 2),
  C("\u7231\u4E01\u5821", -3.2, 56, 0),
  C("\u90FD\u67CF\u6797", -6.3, 53.3, 0),
  C("\u4F26\u6566", -0.1, 51.5, 0),
  C("\u5DF4\u9ECE", 2.35, 48.9, 1),
  C("\u67CF\u6797", 13.4, 52.5, 1),
  C("\u7EBD\u7EA6", -74, 40.7, -5),
  C("\u65E7\u91D1\u5C71", -122.4, 37.8, -8),
  C("\u897F\u96C5\u56FE", -122.3, 47.6, -8),
  C("\u6D1B\u6749\u77F6", -118.2, 34.1, -8),
  C("\u591A\u4F26\u591A", -79.4, 43.7, -5),
  C("\u6E29\u54E5\u534E", -123.1, 49.3, -8),
  C("\u6089\u5C3C", 151.2, -33.9, 10),
  C("\u58A8\u5C14\u672C", 145, -37.8, 10),
  C("\u5965\u514B\u5170", 174.8, -36.8, 12)
];
var PROVINCE_CAPITAL = {
  \u6CB3\u5317: "\u77F3\u5BB6\u5E84",
  \u5C71\u897F: "\u592A\u539F",
  \u5185\u8499\u53E4: "\u547C\u548C\u6D69\u7279",
  \u8FBD\u5B81: "\u6C88\u9633",
  \u5409\u6797: "\u957F\u6625",
  \u9ED1\u9F99\u6C5F: "\u54C8\u5C14\u6EE8",
  \u6C5F\u82CF: "\u5357\u4EAC",
  \u6D59\u6C5F: "\u676D\u5DDE",
  \u5B89\u5FBD: "\u5408\u80A5",
  \u798F\u5EFA: "\u798F\u5DDE",
  \u6C5F\u897F: "\u5357\u660C",
  \u5C71\u4E1C: "\u6D4E\u5357",
  \u6CB3\u5357: "\u90D1\u5DDE",
  \u6E56\u5317: "\u6B66\u6C49",
  \u6E56\u5357: "\u957F\u6C99",
  \u5E7F\u4E1C: "\u5E7F\u5DDE",
  \u5E7F\u897F: "\u5357\u5B81",
  \u6D77\u5357: "\u6D77\u53E3",
  \u56DB\u5DDD: "\u6210\u90FD",
  \u8D35\u5DDE: "\u8D35\u9633",
  \u4E91\u5357: "\u6606\u660E",
  \u897F\u85CF: "\u62C9\u8428",
  \u9655\u897F: "\u897F\u5B89",
  \u7518\u8083: "\u5170\u5DDE",
  \u9752\u6D77: "\u897F\u5B81",
  \u5B81\u590F: "\u94F6\u5DDD",
  \u65B0\u7586: "\u4E4C\u9C81\u6728\u9F50",
  \u53F0\u6E7E: "\u53F0\u5317"
};

// src/engines/solar.js
var norm = (s) => String(s || "").replace(/[\s,，、·。.\-—()（）]/g, "");
function resolvePlace(text) {
  const t = norm(text);
  if (!t) return null;
  const hit = PLACES.filter((p) => t.includes(p.n) || p.n.endsWith("\u5E02") && t.includes(p.n.slice(0, -1)) && !t.includes(`${p.n.slice(0, -1)}\u7701`)).sort((a, b) => b.n.length - a.n.length)[0];
  if (hit) return { name: hit.n.replace(/市$/, ""), lng: hit.lng, lat: hit.lat, tz: hit.tz, source: "city" };
  const prov = Object.keys(PROVINCE_CAPITAL).find((p) => t.includes(p));
  if (prov) {
    const cap = PLACES.find((p) => p.n === PROVINCE_CAPITAL[prov]);
    return { name: `${prov}\uFF08\u6309\u7701\u4F1A${cap.n}\uFF09`, lng: cap.lng, lat: cap.lat, tz: cap.tz, source: "province" };
  }
  return null;
}
function equationOfTime(y, m, d) {
  const start = Date.UTC(y, 0, 1);
  const n = Math.floor((Date.UTC(y, m - 1, d) - start) / 864e5) + 1;
  const B = 2 * Math.PI * (n - 81) / 364;
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
}
var pad = (n) => String(n).padStart(2, "0");
function solarCorrection({ date, time, lng, tz = 8 }) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "12:00").split(":").map(Number);
  const lngMin = (lng - tz * 15) * 4;
  const eot = equationOfTime(y, m, d);
  const offset = Math.round(lngMin + eot);
  const t = new Date(y, m - 1, d, hh, mm + offset, 0);
  return {
    date: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`,
    time: `${pad(t.getHours())}:${pad(t.getMinutes())}`,
    offsetMin: offset,
    lngMin: Math.round(lngMin),
    eot: Math.round(eot),
    dayShift: t.getDate() !== d ? t > new Date(y, m - 1, d, hh, mm) ? 1 : -1 : 0
  };
}
function correctedBirth(profile) {
  const base = { date: profile.birth_date, time: profile.birth_time, applied: false, place: null, lng: null, offsetMin: 0, note: "" };
  if (!profile?.birth_date || profile.time_unknown || profile.source === "pillars" || profile.solar_correction === false) return base;
  const manual = Number(profile.birth_lng);
  const place = Number.isFinite(manual) && manual !== 0 ? { name: profile.birth_place || "\u624B\u586B\u7ECF\u5EA6", lng: manual, tz: 8, source: "manual" } : resolvePlace(profile.birth_place);
  if (!place) return { ...base, note: profile.birth_place ? `\u6CA1\u8BA4\u51FA\u300C${profile.birth_place}\u300D\uFF0C\u672A\u505A\u771F\u592A\u9633\u65F6\u6821\u6B63` : "" };
  const c = solarCorrection({ date: profile.birth_date, time: profile.birth_time, lng: place.lng, tz: place.tz });
  return {
    date: c.date,
    time: c.time,
    applied: true,
    place: place.name,
    lng: place.lng,
    offsetMin: c.offsetMin,
    eot: c.eot,
    lngMin: c.lngMin,
    original: { date: profile.birth_date, time: profile.birth_time },
    note: `\u5DF2\u6309\u771F\u592A\u9633\u65F6\u6821\u6B63\uFF1A${place.name} \u4E1C\u7ECF ${place.lng}\xB0\uFF0C\u949F\u8868 ${profile.birth_time} \u2192 \u771F\u592A\u9633\u65F6 ${c.time}${c.dayShift ? `\uFF08${c.dayShift > 0 ? "\u8DE8\u5230\u6B21\u65E5" : "\u9000\u5230\u524D\u4E00\u65E5"}\uFF09` : ""}\uFF08\u7ECF\u5EA6\u5DEE ${c.lngMin >= 0 ? "+" : ""}${c.lngMin} \u5206\uFF0C\u5747\u65F6\u5DEE ${c.eot >= 0 ? "+" : ""}${c.eot} \u5206\uFF09`
  };
}

// src/engines/distribution.js
function tenGodShares(bazi) {
  const ALL = ["\u6BD4\u80A9", "\u52AB\u8D22", "\u98DF\u795E", "\u4F24\u5B98", "\u504F\u8D22", "\u6B63\u8D22", "\u4E03\u6740", "\u6B63\u5B98", "\u504F\u5370", "\u6B63\u5370"];
  const total = bazi.tenGods.reduce((a, t) => a + t.weight, 0) || 1;
  return ALL.map((god) => {
    const hit = bazi.tenGods.find((t) => t.god === god);
    const pct = hit ? +(hit.weight / total * 100).toFixed(0) : 0;
    return { god, weight: hit ? hit.weight : 0, pct };
  });
}
function analyzeDistribution(bazi) {
  const shares = tenGodShares(bazi);
  const strong = shares.filter((s) => s.pct >= 18).sort((a, b) => b.pct - a.pct);
  const absent = shares.filter((s) => s.pct === 0);
  const scarce = shares.filter((s) => s.pct > 0 && s.pct < 6);
  const monthGod = bazi.pillars[1].ssGan;
  const monthZhiGods = Array.isArray(bazi.pillars[1].ssZhi) ? bazi.pillars[1].ssZhi.filter(Boolean) : [bazi.pillars[1].ssZhi].filter(Boolean);
  return { shares, strong, absent, scarce, monthGod, monthZhiGod: monthZhiGods[0] || null };
}

// src/data/readings.js
var TEN_GODS_FULL = {
  \u6BD4\u80A9: {
    headline: "\u4F60\u5F88\u96BE\u628A\u81EA\u5DF1\u4EA4\u7ED9\u522B\u4EBA\u5B89\u6392\u3002",
    bestSelf: "\u4E00\u4E2A\u4EBA\u5224\u65AD\u3001\u4E00\u4E2A\u4EBA\u63A8\u8FDB\uFF0C\u4E0D\u5FC5\u53CD\u590D\u5411\u522B\u4EBA\u89E3\u91CA\u7684\u65F6\u5019\u3002",
    scenes: [
      "\u522B\u4EBA\u7ED9\u4F60\u89C4\u5212\u597D\u7684\u8DEF\u7EBF\uFF0C\u4F60\u7684\u7B2C\u4E00\u53CD\u5E94\u4E0D\u662F\u300C\u597D\u300D\uFF0C\u800C\u662F\u300C\u4E3A\u4EC0\u4E48\u4E0D\u80FD\u6362\u4E00\u6761\u300D\u3002",
      "\u4F60\u5B81\u53EF\u81EA\u5DF1\u591A\u82B1\u4E24\u5929\u505A\u5B8C\uFF0C\u4E5F\u4E0D\u592A\u613F\u610F\u5F00\u53E3\u6C42\u4EBA\u5E2E\u5FD9\u3002",
      "\u56E2\u961F\u91CC\u4F60\u4E0D\u62A2\u8BDD\uFF0C\u4F46\u522B\u4EBA\u7684\u5B89\u6392\u4F60\u4E5F\u4E0D\u4E00\u5B9A\u771F\u7684\u542C\u8FDB\u53BB\u4E86\u3002"
    ],
    social: ["\u4F60\u4E0D\u592A\u4F1A\u4E3B\u52A8\u6C42\u4EBA\uFF0C\u54EA\u6015\u5BF9\u65B9\u660E\u663E\u613F\u610F\u5E2E\u3002", "\u670B\u53CB\u4E4B\u95F4\u4F60\u66F4\u50CF\u5E76\u80A9\u7684\u90A3\u79CD\uFF0C\u4E0D\u662F\u4F9D\u9644\u7684\u90A3\u79CD\u3002"],
    work: "\u5DE5\u4F5C\u6216\u5408\u4F5C\u65F6\u4F60\u4E60\u60EF\u81EA\u5DF1\u62FF\u4E3B\u610F\u3001\u4E3B\u5BFC\u8282\u594F\uFF0C\u4E0D\u592A\u5BB9\u6613\u88AB\u522B\u4EBA\u7684\u610F\u89C1\u5DE6\u53F3\u3002\u5E26\u56E2\u961F\u6216\u81EA\u5DF1\u505A\u4E8B\u7684\u65F6\u5019\uFF0C\u4F60\u6709\u51B2\u52B2\u4E5F\u6709\u4E3B\u89C1\uFF0C\u4E0D\u6015\u5355\u6253\u72EC\u6597\u3002",
    because: "\u547D\u91CC\u300C\u6BD4\u80A9\u300D\u91CD\uFF0C\u6307\u7684\u662F\u548C\u4F60\u540C\u7C7B\u3001\u5730\u4F4D\u5E73\u7B49\u7684\u529B\u91CF\u591A\u3002\u4F60\u5929\u7136\u628A\u81EA\u5DF1\u5F53\u6210\u4E00\u4E2A\u72EC\u7ACB\u5355\u4F4D\uFF0C\u800C\u4E0D\u662F\u67D0\u4E2A\u7ED3\u6784\u91CC\u7684\u4E00\u683C\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u8FC7\u5934\uFF0C\u5C31\u4F1A\u53D8\u6210\u8FC7\u5EA6\u81EA\u4FE1\u3001\u542C\u4E0D\u8FDB\u5EFA\u8BAE\uFF0C\u6709\u70B9\u4EE5\u81EA\u6211\u4E3A\u4E2D\u5FC3\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u4F60\u7684\u72EC\u7ACB\u548C\u97E7\u52B2\u4F1A\u88AB\u770B\u89C1\uFF0C\u5468\u56F4\u613F\u610F\u5E2E\u4F60\u7684\u4EBA\u4E0D\u5C11\uFF0C\u4F60\u4E5F\u786E\u5B9E\u80FD\u625B\u4E8B\u3002\u8981\u6CE8\u610F\u7684\u662F\u624B\u91CC\u6709\u8D44\u6E90\u4E4B\u540E\u4ECD\u8981\u8E0F\u5B9E\uFF0C\u5426\u5219\u8D44\u6E90\u5BB9\u6613\u88AB\u6D6A\u8D39\u6389\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u4F60\u4F1A\u89C9\u5F97\u5904\u5904\u88AB\u63A3\u8098\uFF0C\u60F3\u81EA\u5DF1\u505A\u4E3B\u5374\u505A\u4E0D\u4E86\u4E3B\u3002\u4E0D\u8FC7\u4F60\u901A\u5E38\u4E0D\u670D\u8F93\uFF0C\u4F4E\u8C37\u91CC\u53CD\u5F39\u7684\u529B\u6C14\u53CD\u800C\u6BD4\u522B\u4EBA\u8DB3\u3002",
    absent: "\u547D\u91CC\u6BD4\u80A9\u504F\u5C11\uFF0C\u8BF4\u660E\u4F60\u4E0D\u592A\u6709\u300C\u6211\u5FC5\u987B\u662F\u72EC\u7ACB\u4E2A\u4F53\u300D\u7684\u6267\u5FF5\u3002\u4F60\u66F4\u5BB9\u6613\u878D\u8FDB\u4E00\u4E2A\u56E2\u961F\u6216\u4E00\u6BB5\u5173\u7CFB\u91CC\uFF0C\u597D\u5904\u662F\u914D\u5408\u5EA6\u9AD8\uFF0C\u4EE3\u4EF7\u662F\u6709\u65F6\u5019\u4F1A\u627E\u4E0D\u5230\u81EA\u5DF1\u7684\u4F4D\u7F6E\u3002",
    advice: "\u5728\u771F\u6B63\u91CD\u8981\u7684\u4E8B\u60C5\u4E0A\u4FDD\u7559\u81EA\u5DF1\u62FF\u4E3B\u610F\u7684\u6743\u5229\uFF0C\u4F46\u628A\u300C\u542C\u4E00\u53E5\u522B\u4EBA\u7684\u300D\u53D8\u6210\u6D41\u7A0B\u7684\u4E00\u90E8\u5206\u2014\u2014\u4E0D\u662F\u4E3A\u4E86\u542C\u8BDD\uFF0C\u662F\u4E3A\u4E86\u522B\u5728\u540C\u4E00\u4E2A\u5751\u91CC\u6454\u7B2C\u4E8C\u6B21\u3002",
    cost: "\u4EC0\u4E48\u90FD\u81EA\u5DF1\u625B\uFF0C\u65F6\u95F4\u957F\u4E86\u4F1A\u7D2F\uFF0C\u800C\u4F60\u504F\u504F\u4E0D\u592A\u4F1A\u8BF4\u7D2F\u3002",
    gift: "\u73AF\u5883\u518D\u4E71\u4F60\u4E5F\u77E5\u9053\u81EA\u5DF1\u662F\u8C01\uFF0C\u8FD9\u79CD\u7A33\u5B9A\u662F\u522B\u4EBA\u62FF\u4E0D\u8D70\u7684\u3002"
  },
  \u52AB\u8D22: {
    headline: "\u4F60\u8EAB\u4E0A\u6709\u4E00\u80A1\u300C\u4E0D\u80FD\u843D\u4E0B\u300D\u7684\u52B2\u3002",
    bestSelf: "\u6709\u660E\u786E\u5BF9\u624B\u3001\u6709\u8F93\u8D62\u3001\u9700\u8981\u51B2\u4E00\u628A\u7684\u65F6\u5019\u3002",
    scenes: [
      "\u770B\u5230\u522B\u4EBA\u62FF\u5230\u4F60\u60F3\u8981\u7684\u673A\u4F1A\uFF0C\u4F60\u7684\u7B2C\u4E00\u53CD\u5E94\u4E0D\u662F\u7FA1\u6155\uFF0C\u662F\u300C\u6211\u4E5F\u53EF\u4EE5\u300D\u3002",
      "\u4F60\u82B1\u94B1\u548C\u8D5A\u94B1\u90FD\u6BD4\u5468\u56F4\u4EBA\u5FEB\u4E00\u6863\u3002",
      "\u5408\u4F5C\u5206\u8D26\u7684\u65F6\u5019\uFF0C\u4F60\u5FC3\u91CC\u90A3\u672C\u8D26\u5176\u5B9E\u7B97\u5F97\u5F88\u6E05\u695A\uFF0C\u53EA\u662F\u4E0D\u4E00\u5B9A\u8BF4\u51FA\u53E3\u3002"
    ],
    social: ["\u4F60\u8EAB\u8FB9\u4E0D\u7F3A\u670B\u53CB\uFF0C\u4F46\u4E5F\u4E0D\u7F3A\u8DDF\u4F60\u62A2\u540C\u4E00\u6837\u4E1C\u897F\u7684\u4EBA\u3002", "\u501F\u94B1\u8FD9\u7C7B\u4E8B\u5728\u4F60\u8FD9\u513F\u5BB9\u6613\u53D8\u590D\u6742\uFF0C\u6240\u4EE5\u4F60\u80FD\u907F\u5C31\u907F\u3002"],
    work: "\u4F60\u5728\u7ADE\u4E89\u6027\u7684\u73AF\u5883\u91CC\u72B6\u6001\u6700\u597D\u2014\u2014\u6709\u5BF9\u624B\u3001\u6709\u6392\u540D\u3001\u6709\u660E\u786E\u7684\u8F93\u8D62\uFF0C\u4F60\u5C31\u6765\u52B2\u3002\u53CD\u8FC7\u6765\uFF0C\u5728\u8BB2\u7A76\u8BBA\u8D44\u6392\u8F88\u3001\u770B\u4E0D\u51FA\u80DC\u8D1F\u7684\u5730\u65B9\uFF0C\u4F60\u4F1A\u89C9\u5F97\u618B\u5F97\u614C\u3002",
    because: "\u300C\u52AB\u8D22\u300D\u662F\u548C\u4F60\u540C\u7C7B\u4F46\u6027\u8D28\u76F8\u53CD\u7684\u529B\u91CF\u3002\u5B83\u8BA9\u4F60\u5BF9\u300C\u88AB\u843D\u4E0B\u300D\u8FD9\u4EF6\u4E8B\u7279\u522B\u654F\u611F\uFF0C\u4E5F\u8BA9\u4F60\u5728\u8D44\u6E90\u9762\u524D\u66F4\u613F\u610F\u4F38\u624B\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u8FC7\u5934\uFF0C\u5C31\u5BB9\u6613\u53D8\u6210\u4EC0\u4E48\u90FD\u8981\u4E89\uFF0C\u8FDE\u4E0D\u91CD\u8981\u7684\u4E8B\u4E5F\u4E0D\u80AF\u8BA9\uFF0C\u53CD\u800C\u628A\u4EBA\u5F97\u7F6A\u5149\u4E86\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u4F60\u7684\u884C\u52A8\u529B\u548C\u4E89\u53D6\u5FC3\u4F1A\u8F6C\u5316\u6210\u5B9E\u9645\u7684\u6536\u83B7\uFF0C\u6562\u60F3\u6562\u505A\uFF0C\u673A\u4F1A\u6765\u4E86\u6293\u5F97\u4F4F\u3002\u8981\u6CE8\u610F\u7684\u662F\u5408\u4F5C\u65F6\u628A\u89C4\u5219\u8C08\u5728\u524D\u9762\uFF0C\u94B1\u7684\u4E8B\u522B\u542B\u7CCA\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u4F60\u4F1A\u5E38\u5E38\u611F\u5230\u300C\u660E\u660E\u6211\u4E5F\u884C\uFF0C\u4E3A\u4EC0\u4E48\u8F6E\u4E0D\u5230\u6211\u300D\u3002\u8FD9\u79CD\u4E0D\u7518\u5FC3\u5982\u679C\u8F6C\u6210\u52AA\u529B\u5C31\u662F\u597D\u4E8B\uFF0C\u8F6C\u6210\u6028\u6C14\u5C31\u6D88\u8017\u81EA\u5DF1\u3002",
    absent: "\u547D\u91CC\u52AB\u8D22\u504F\u5C11\uFF0C\u8BF4\u660E\u4F60\u4E0D\u592A\u4F1A\u8DDF\u4EBA\u6B63\u9762\u62A2\u3002\u4F60\u4E0D\u5BB9\u6613\u6811\u654C\uFF0C\u4F46\u8BE5\u51FA\u624B\u7684\u65F6\u5019\u5E38\u5E38\u6162\u534A\u62CD\uFF0C\u673A\u4F1A\u88AB\u522B\u4EBA\u5148\u62FF\u8D70\u4E86\u4F60\u624D\u53CD\u5E94\u8FC7\u6765\u3002",
    advice: "\u628A\u4E89\u53D6\u7684\u529B\u6C14\u7528\u5728\u771F\u6B63\u7A00\u7F3A\u7684\u4E1C\u897F\u4E0A\uFF0C\u5176\u4F59\u7684\u4E3B\u52A8\u8BA9\u51FA\u53BB\u2014\u2014\u4F60\u4F1A\u53D1\u73B0\u8BA9\u6389\u7684\u90A3\u4E9B\uFF0C\u672C\u6765\u4E5F\u4E0D\u5F71\u54CD\u7ED3\u5C40\u3002",
    cost: "\u4F60\u5BB9\u6613\u5728\u300C\u518D\u4E89\u4E00\u4E0B\u300D\u548C\u300C\u7B97\u4E86\u300D\u4E4B\u95F4\u53CD\u590D\uFF0C\u4E24\u8FB9\u90FD\u6D88\u8017\u4F60\u3002",
    gift: "\u771F\u5230\u4E86\u8981\u62A2\u7684\u65F6\u5019\uFF0C\u4F60\u4E0D\u4F1A\u624B\u8F6F\u2014\u2014\u5F88\u591A\u4EBA\u8FD9\u4E00\u6B65\u5C31\u8FC8\u4E0D\u51FA\u53BB\u3002"
  },
  \u98DF\u795E: {
    headline: "\u4F60\u505A\u4E8B\u6709\u4E00\u79CD\u4E0D\u614C\u7684\u52B2\u3002",
    bestSelf: "\u4E0D\u8D76\u65F6\u95F4\uFF0C\u6162\u6162\u628A\u4E00\u4EF6\u559C\u6B22\u7684\u4E8B\u505A\u51FA\u6765\u7684\u65F6\u5019\u3002",
    scenes: [
      "\u771F\u6B63\u559C\u6B22\u7684\u4E8B\uFF0C\u4F60\u80FD\u4E00\u4E2A\u4EBA\u505A\u5F88\u4E45\uFF0C\u4E0D\u9700\u8981\u8C01\u50AC\u3002",
      "\u4F60\u5BF9\u300C\u597D\u5403\u3001\u597D\u770B\u3001\u5F85\u7740\u8212\u670D\u300D\u8FD9\u7C7B\u4E8B\uFF0C\u654F\u611F\u5EA6\u9AD8\u4E8E\u5E73\u5747\u3002",
      "\u522B\u4EBA\u95EE\u4F60\u4E3A\u4EC0\u4E48\u505A\u8FD9\u4E2A\uFF0C\u4F60\u53EF\u80FD\u7B54\u4E0D\u4E0A\u529F\u5229\u7684\u7406\u7531\u2014\u2014\u5C31\u662F\u60F3\u505A\u3002"
    ],
    social: ["\u4F60\u8DDF\u4EBA\u76F8\u5904\u4E0D\u7D2F\uFF0C\u4F46\u4E5F\u4E0D\u592A\u4E3B\u52A8\u7EF4\u7CFB\uFF0C\u5173\u7CFB\u662F\u81EA\u7136\u957F\u51FA\u6765\u7684\u3002", "\u4F60\u559C\u6B22\u4E00\u8D77\u5403\u70B9\u597D\u7684\u3001\u5F85\u7740\u804A\u5929\uFF0C\u4E0D\u559C\u6B22\u6709\u76EE\u7684\u7684\u5C40\u3002"],
    work: "\u4F60\u9002\u5408\u6709\u4EA7\u51FA\u3001\u6709\u4F5C\u54C1\u7684\u5DE5\u4F5C\uFF0C\u8282\u594F\u53EF\u4EE5\u6162\u4F46\u8981\u770B\u5F97\u89C1\u4E1C\u897F\u957F\u51FA\u6765\u3002\u7EAF\u6267\u884C\u3001\u7EAF\u6551\u706B\u7684\u5C97\u4F4D\u4F1A\u78E8\u6389\u4F60\u6700\u597D\u7684\u90A3\u90E8\u5206\u3002",
    because: "\u300C\u98DF\u795E\u300D\u662F\u4F60\u5F80\u5916\u751F\u53D1\u7684\u3001\u6E29\u548C\u7684\u90A3\u90E8\u5206\u3002\u5B83\u4E0D\u8FFD\u6C42\u8D62\uFF0C\u8FFD\u6C42\u7684\u662F\u628A\u559C\u6B22\u7684\u4E1C\u897F\u505A\u51FA\u6765\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u8FC7\u5934\uFF0C\u5BB9\u6613\u53D8\u6210\u5B89\u4E8E\u73B0\u72B6\u3001\u7F3A\u4E4F\u8FDB\u53D6\uFF0C\u628A\u300C\u8212\u670D\u300D\u5F53\u6210\u552F\u4E00\u6807\u51C6\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u4F60\u5728\u6587\u5316\u3001\u521B\u4F5C\u3001\u9910\u996E\u3001\u6559\u80B2\u8FD9\u7C7B\u8DDF\u300C\u505A\u51FA\u597D\u4E1C\u897F\u300D\u6709\u5173\u7684\u9886\u57DF\u4F1A\u6BD4\u8F83\u987A\uFF0C\u4E5F\u5BB9\u6613\u56E0\u4E3A\u8FD9\u4EFD\u4ECE\u5BB9\u800C\u8BA8\u4EBA\u559C\u6B22\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u4F60\u4F1A\u89C9\u5F97\u60F3\u505A\u7684\u4E8B\u603B\u88AB\u73B0\u5B9E\u6253\u65AD\uFF0C\u5174\u8DA3\u63D0\u4E0D\u8D77\u6765\uFF0C\u505A\u4EC0\u4E48\u90FD\u5DEE\u4E00\u53E3\u6C14\u3002",
    absent: "\u547D\u91CC\u98DF\u795E\u504F\u5C11\uFF0C\u8BF4\u660E\u4F60\u4E0D\u592A\u6709\u300C\u4E3A\u4E86\u559C\u6B22\u800C\u505A\u300D\u7684\u60EF\u6027\u3002\u4F60\u505A\u4E8B\u76EE\u7684\u6027\u66F4\u5F3A\uFF0C\u6548\u7387\u9AD8\uFF0C\u4F46\u4E5F\u66F4\u5BB9\u6613\u7D2F\u2014\u2014\u56E0\u4E3A\u5C11\u4E86\u90A3\u6761\u80FD\u81EA\u5DF1\u56DE\u8840\u7684\u8DEF\u3002",
    advice: "\u7ED9\u300C\u6CA1\u6709\u4EA7\u51FA\u8981\u6C42\u300D\u7684\u4E8B\u60C5\u7559\u51FA\u56FA\u5B9A\u65F6\u95F4\u3002\u8FD9\u4E0D\u662F\u6D6A\u8D39\uFF0C\u8FD9\u662F\u4F60\u6062\u590D\u7684\u65B9\u5F0F\u3002",
    cost: "\u4F60\u4E0D\u64C5\u957F\u5728\u6CA1\u6709\u5174\u8DA3\u7684\u4E8B\u4E0A\u786C\u6491\uFF0C\u800C\u4EBA\u751F\u91CC\u8FD9\u7C7B\u4E8B\u4E0D\u5C11\u3002",
    gift: "\u4F60\u505A\u51FA\u6765\u7684\u4E1C\u897F\u91CC\u6709\u4E00\u79CD\u677E\u5F1B\u611F\uFF0C\u90A3\u662F\u6025\u51FA\u6765\u7684\u4EBA\u505A\u4E0D\u51FA\u6765\u7684\u3002"
  },
  \u4F24\u5B98: {
    headline: "\u4F60\u6709\u8BDD\u76F4\u8BF4\uFF0C\u4E8B\u540E\u624D\u60F3\u8D77\u90A3\u8BDD\u53EF\u80FD\u4E0D\u8BE5\u8BF4\u3002",
    bestSelf: "\u6709\u4EBA\u771F\u5FC3\u60F3\u542C\u4F60\u8BF4\u771F\u8BDD\u3001\u4E5F\u63A5\u5F97\u4F4F\u7684\u65F6\u5019\u3002",
    scenes: [
      "\u4F1A\u4E0A\u6709\u4EBA\u5728\u8BB2\u4E00\u4E2A\u660E\u663E\u6709\u95EE\u9898\u7684\u65B9\u6848\uFF0C\u4F60\u5F88\u96BE\u5FCD\u4F4F\u4E0D\u6307\u51FA\u6765\u3002",
      "\u4F60\u4EA4\u51FA\u53BB\u7684\u4E1C\u897F\u5E38\u5E38\u6BD4\u8981\u6C42\u7684\u597D\uFF0C\u4F46\u8FC7\u7A0B\u91CC\u4F60\u6311\u6218\u6389\u4E86\u4E00\u534A\u7684\u8981\u6C42\u3002",
      "\u5BF9\u300C\u56E0\u4E3A\u89C4\u5B9A\u5C31\u662F\u8FD9\u6837\u300D\u8FD9\u79CD\u7406\u7531\uFF0C\u4F60\u57FA\u672C\u6CA1\u6709\u8010\u5FC3\u3002"
    ],
    social: ["\u4F60\u8BF4\u8BDD\u76F4\uFF0C\u4E8B\u540E\u624D\u53D1\u73B0\u5BF9\u65B9\u8138\u8272\u53D8\u4E86\u3002", "\u4F60\u6B23\u8D4F\u7684\u4EBA\u4E0D\u591A\uFF0C\u4F46\u4E00\u65E6\u6B23\u8D4F\u5C31\u638F\u5FC3\u638F\u80BA\u3002"],
    work: "\u4F60\u9002\u5408\u9760\u672C\u4E8B\u8BF4\u8BDD\u3001\u7ED3\u679C\u80FD\u88AB\u76F4\u63A5\u770B\u89C1\u7684\u5730\u65B9\u2014\u2014\u6280\u672F\u3001\u521B\u4F5C\u3001\u4E13\u4E1A\u5C97\u4F4D\u3002\u5C42\u7EA7\u8D8A\u591A\u3001\u8D8A\u8BB2\u7A76\u573A\u9762\u8BDD\u7684\u73AF\u5883\uFF0C\u4F60\u7684\u80FD\u529B\u8D8A\u5BB9\u6613\u88AB\u4F60\u7684\u6027\u683C\u62B5\u6D88\u6389\u3002",
    because: "\u300C\u4F24\u5B98\u300D\u4E5F\u662F\u4F60\u5F80\u5916\u751F\u53D1\u7684\u529B\u91CF\uFF0C\u4F46\u5B83\u662F\u950B\u5229\u7684\u90A3\u4E00\u79CD\u3002\u624D\u534E\u548C\u4E0D\u670D\u7BA1\uFF0C\u5728\u547D\u7406\u91CC\u662F\u540C\u4E00\u4E2A\u4E1C\u897F\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u8FC7\u5934\uFF0C\u5C31\u4F1A\u53D8\u6210\u9022\u4EBA\u5FC5\u603C\u3001\u89C1\u4E8B\u5FC5\u6311\uFF0C\u660E\u660E\u662F\u5BF9\u7684\u4E5F\u6CA1\u4EBA\u542C\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u4F60\u7684\u624D\u534E\u4F1A\u88AB\u770B\u89C1\uFF0C\u9002\u5408\u505A\u9700\u8981\u4E2A\u4EBA\u98CE\u683C\u7684\u4E8B\uFF0C\u4E5F\u5BB9\u6613\u5728\u4E13\u4E1A\u4E0A\u505A\u51FA\u540D\u5802\u3002\u8981\u6CE8\u610F\u7684\u662F\u628A\u8BDD\u8BF4\u5706\u4E00\u70B9\uFF0C\u4F60\u635F\u5931\u4E0D\u4E86\u4EC0\u4E48\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u4F60\u4F1A\u89C9\u5F97\u6709\u529B\u4F7F\u4E0D\u51FA\u2014\u2014\u60F3\u8BF4\u7684\u4E0D\u80FD\u8BF4\uFF0C\u505A\u51FA\u6765\u7684\u6CA1\u4EBA\u8BA4\uFF0C\u957F\u671F\u4E0B\u6765\u5BB9\u6613\u618B\u51FA\u60C5\u7EEA\u3002",
    absent: "\u547D\u91CC\u4F24\u5B98\u504F\u5C11\uFF0C\u8BF4\u660E\u4F60\u4E0D\u592A\u5916\u9732\u950B\u8292\u3002\u4F60\u6BD4\u8F83\u5B88\u89C4\u77E9\u3001\u4E0D\u592A\u5F97\u7F6A\u4EBA\uFF0C\u4EE3\u4EF7\u662F\u522B\u4EBA\u4E5F\u4E0D\u592A\u8BB0\u5F97\u4F4F\u4F60\u2014\u2014\u4F60\u7684\u8FA8\u8BC6\u5EA6\u9700\u8981\u9760\u522B\u7684\u65B9\u5F0F\u5EFA\u7ACB\u3002",
    advice: "\u628A\u300C\u6307\u51FA\u95EE\u9898\u300D\u548C\u300C\u6307\u51FA\u95EE\u9898\u7684\u65B9\u5F0F\u300D\u5206\u5F00\u7EC3\u3002\u524D\u8005\u662F\u4F60\u7684\u5929\u8D4B\uFF0C\u540E\u8005\u662F\u53EF\u4EE5\u5B66\u7684\u6280\u672F\uFF0C\u5B66\u4F1A\u4E86\u4F60\u7684\u5929\u8D4B\u624D\u80FD\u5151\u73B0\u3002",
    cost: "\u4F60\u7684\u80FD\u529B\u5E38\u5E38\u5148\u88AB\u770B\u89C1\uFF0C\u9EBB\u70E6\u7D27\u8DDF\u7740\u4E5F\u6765\u2014\u2014\u5C24\u5176\u5728\u6709\u660E\u786E\u4E0A\u7EA7\u7684\u5730\u65B9\u3002",
    gift: "\u4F60\u8EAB\u4E0A\u90A3\u70B9\u950B\u5229\u662F\u522B\u4EBA\u590D\u5236\u4E0D\u4E86\u7684\uFF0C\u4E5F\u5F80\u5F80\u662F\u4F60\u6700\u503C\u94B1\u7684\u90E8\u5206\u3002"
  },
  \u504F\u8D22: {
    headline: "\u673A\u4F1A\u603B\u662F\u4ECE\u4EBA\u8EAB\u4E0A\u6765\u627E\u4F60\u3002",
    bestSelf: "\u5728\u4E00\u684C\u964C\u751F\u4EBA\u91CC\uFF0C\u628A\u5173\u7CFB\u804A\u6210\u673A\u4F1A\u7684\u65F6\u5019\u3002",
    scenes: [
      "\u4F60\u7684\u5F88\u591A\u597D\u4E8B\u662F\u804A\u51FA\u6765\u7684\uFF0C\u4E0D\u662F\u89C4\u5212\u51FA\u6765\u7684\u3002",
      "\u4F60\u624B\u4E0A\u5E38\u5E38\u540C\u65F6\u6709\u597D\u51E0\u6761\u7EBF\uFF0C\u4F46\u6CA1\u6709\u4E00\u6761\u662F\u7279\u522B\u7A33\u7684\u3002",
      "\u94B1\u6765\u5F97\u5FEB\u53BB\u5F97\u4E5F\u5FEB\uFF0C\u4F60\u81EA\u5DF1\u4E5F\u8BF4\u4E0D\u592A\u6E05\u5177\u4F53\u82B1\u5728\u54EA\u4E86\u3002"
    ],
    social: ["\u4F60\u7684\u670B\u53CB\u5206\u5E03\u5F88\u5E7F\uFF0C\u5404\u884C\u5404\u4E1A\u90FD\u6709\u51E0\u4E2A\u3002", "\u996D\u684C\u4E0A\u4F60\u662F\u80FD\u628A\u6C14\u6C1B\u5E26\u8D77\u6765\u7684\u90A3\u4E2A\uFF0C\u4F46\u6563\u573A\u4E4B\u540E\u4E0D\u4E00\u5B9A\u8FD8\u8054\u7CFB\u3002"],
    work: "\u4F60\u9002\u5408\u8DDF\u4EBA\u6253\u4EA4\u9053\u3001\u6709\u63D0\u6210\u6709\u6D6E\u52A8\u7684\u5DE5\u4F5C\u2014\u2014\u9500\u552E\u3001business development\u3001\u81EA\u5DF1\u505A\u9879\u76EE\u3002\u56FA\u5B9A\u5DE5\u8D44\u3001\u56FA\u5B9A\u6D41\u7A0B\u7684\u5C97\u4F4D\u4F1A\u8BA9\u4F60\u89C9\u5F97\u4F7F\u4E0D\u4E0A\u52B2\u3002",
    because: "\u300C\u504F\u8D22\u300D\u4EE3\u8868\u4F60\u80FD\u638C\u63A7\u7684\u3001\u6D41\u52A8\u6027\u5F3A\u7684\u8D44\u6E90\u3002\u5B83\u628A\u4EBA\u3001\u673A\u4F1A\u548C\u94B1\u7ED1\u5728\u4E00\u8D77\uFF0C\u6240\u4EE5\u4F60\u7684\u6536\u83B7\u591A\u534A\u6765\u81EA\u5173\u7CFB\u800C\u4E0D\u662F\u6D41\u7A0B\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u8FC7\u5934\uFF0C\u5BB9\u6613\u53D8\u6210\u4EC0\u4E48\u673A\u4F1A\u90FD\u60F3\u6293\uFF0C\u644A\u5B50\u94FA\u5F97\u592A\u5F00\uFF0C\u6700\u540E\u54EA\u4E2A\u90FD\u6CA1\u505A\u6210\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u4F60\u7684\u5546\u4E1A\u55C5\u89C9\u548C\u4EBA\u8109\u4F1A\u771F\u7684\u53D8\u6210\u94B1\uFF0C\u9002\u5408\u505A\u7ECF\u8425\u3001\u6295\u8D44\u3001\u6E20\u9053\u8FD9\u7C7B\u4E8B\uFF0C\u6765\u94B1\u7684\u8DEF\u5B50\u6BD4\u522B\u4EBA\u591A\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u4F60\u4F1A\u770B\u5230\u5F88\u591A\u673A\u4F1A\u4F46\u6293\u4E0D\u4F4F\uFF0C\u6216\u8005\u6293\u4F4F\u4E86\u7559\u4E0D\u4E0B\u2014\u2014\u8D5A\u5F97\u5230\uFF0C\u4F46\u5B58\u4E0D\u4E0B\u3002",
    absent: "\u547D\u91CC\u504F\u8D22\u504F\u5C11\uFF0C\u8BF4\u660E\u4F60\u5BF9\u300C\u610F\u5916\u4E4B\u8D22\u300D\u548C\u300C\u9760\u5173\u7CFB\u62FF\u5230\u7684\u673A\u4F1A\u300D\u90FD\u4E0D\u592A\u654F\u611F\u3002\u4F60\u7684\u6536\u5165\u66F4\u4F9D\u8D56\u56FA\u5B9A\u6765\u6E90\uFF0C\u7A33\uFF0C\u4F46\u5929\u82B1\u677F\u4E5F\u66F4\u660E\u663E\u3002",
    advice: "\u7ED9\u81EA\u5DF1\u8BBE\u4E00\u6761\u4E0D\u53EF\u52A8\u7684\u5E95\u7EBF\u8D44\u91D1\uFF0C\u5269\u4E0B\u7684\u518D\u53BB\u535A\u673A\u4F1A\u3002\u4F60\u7F3A\u7684\u4E0D\u662F\u673A\u4F1A\uFF0C\u662F\u673A\u4F1A\u6765\u7684\u65F6\u5019\u624B\u91CC\u8FD8\u6709\u724C\u3002",
    cost: "\u6536\u5165\u548C\u5FC3\u60C5\u90FD\u8DDF\u7740\u673A\u4F1A\u8D77\u4F0F\uFF0C\u4F60\u7F3A\u4E00\u4E2A\u7A33\u7684\u5E95\u3002",
    gift: "\u4F60\u5728\u4E0D\u786E\u5B9A\u91CC\u6BD4\u5927\u591A\u6570\u4EBA\u81EA\u5728\uFF0C\u8FD9\u662F\u4E00\u79CD\u5F88\u5C11\u89C1\u7684\u80FD\u529B\u3002"
  },
  \u6B63\u8D22: {
    headline: "\u4F60\u4FE1\u7684\u662F\u80FD\u7B97\u6E05\u695A\u7684\u4E1C\u897F\u3002",
    bestSelf: "\u8D26\u7B97\u5F97\u6E05\u3001\u8DEF\u770B\u5F97\u89C1\uFF0C\u4E00\u6B65\u4E00\u6B65\u628A\u4E8B\u6512\u8D77\u6765\u7684\u65F6\u5019\u3002",
    scenes: [
      "\u522B\u4EBA\u8DDF\u4F60\u8BB2\u300C\u60F3\u8C61\u7A7A\u95F4\u300D\uFF0C\u4F60\u4F1A\u5148\u95EE\u300C\u90A3\u73B0\u5728\u6536\u5165\u662F\u591A\u5C11\u300D\u3002",
      "\u4F60\u4E0D\u592A\u613F\u610F\u4E3A\u4E00\u4E2A\u53EF\u80FD\u6027\uFF0C\u653E\u5F03\u5DF2\u7ECF\u63E1\u5728\u624B\u91CC\u7684\u3002",
      "\u4F60\u7684\u94B1\u5927\u6982\u80FD\u8BF4\u6E05\u6BCF\u4E00\u7B14\u53BB\u4E86\u54EA\u3002"
    ],
    social: ["\u4F60\u7684\u5173\u7CFB\u5EFA\u7ACB\u5F97\u6162\uFF0C\u4F46\u65AD\u5F97\u4E5F\u6162\u3002", "\u4F60\u5224\u65AD\u4E00\u4E2A\u4EBA\u66F4\u770B\u4ED6\u505A\u4E86\u4EC0\u4E48\uFF0C\u4E0D\u592A\u770B\u8BDD\u8BF4\u5F97\u597D\u4E0D\u597D\u542C\u3002"],
    work: "\u4F60\u9002\u5408\u80FD\u79EF\u7D2F\u3001\u80FD\u6C89\u6DC0\u7684\u5DE5\u4F5C\u2014\u2014\u4E13\u4E1A\u6280\u80FD\u3001\u8D22\u52A1\u3001\u8FD0\u8425\u3001\u7BA1\u7406\u3002\u98CE\u53E3\u578B\u3001\u8D4C\u7206\u53D1\u7684\u4E8B\u60C5\u4F60\u53C2\u4E0E\u8FDB\u53BB\u4F1A\u5F88\u96BE\u53D7\uFF0C\u56E0\u4E3A\u4E0D\u786E\u5B9A\u6027\u5BF9\u4F60\u662F\u7EAF\u6D88\u8017\u3002",
    because: "\u300C\u6B63\u8D22\u300D\u662F\u7A33\u5B9A\u7684\u3001\u53EF\u6838\u7B97\u7684\u8D44\u6E90\u3002\u5B83\u8BA9\u4F60\u5BF9\u300C\u786E\u5B9A\u7684\u5C11\u300D\u6BD4\u300C\u4E0D\u786E\u5B9A\u7684\u591A\u300D\u66F4\u6709\u5B89\u5168\u611F\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u8FC7\u5934\uFF0C\u5BB9\u6613\u53D8\u6210\u8FC7\u5206\u8BA1\u8F83\u3001\u683C\u5C40\u6253\u4E0D\u5F00\uFF0C\u4E3A\u4E86\u7701\u5C0F\u94B1\u9519\u8FC7\u5927\u4E8B\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u4F60\u7684\u8E0F\u5B9E\u4F1A\u771F\u7684\u53D8\u6210\u79EF\u7D2F\uFF0C\u5BB6\u5E95\u8D8A\u6512\u8D8A\u539A\uFF0C\u4E2D\u5E74\u4E4B\u540E\u7684\u5DEE\u8DDD\u4F1A\u660E\u663E\u663E\u51FA\u6765\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u4F60\u4F1A\u89C9\u5F97\u6323\u7684\u94B1\u603B\u7559\u4E0D\u4F4F\uFF0C\u6216\u8005\u4E3A\u4E86\u94B1\u4E0D\u5F97\u4E0D\u505A\u4E00\u4E9B\u8FDD\u80CC\u672C\u610F\u7684\u9009\u62E9\u3002",
    absent: "\u547D\u91CC\u6B63\u8D22\u504F\u5C11\uFF0C\u8BF4\u660E\u4F60\u5BF9\u300C\u7EC6\u6C34\u957F\u6D41\u300D\u8FD9\u4EF6\u4E8B\u6CA1\u4EC0\u4E48\u6267\u5FF5\u3002\u4F60\u53EF\u80FD\u66F4\u88AB\u5927\u673A\u4F1A\u5438\u5F15\uFF0C\u4EE3\u4EF7\u662F\u57FA\u672C\u76D8\u4E0D\u591F\u7262\uFF0C\u8D77\u843D\u4F1A\u6BD4\u522B\u4EBA\u5927\u3002",
    advice: "\u5728\u4F60\u7B97\u5F97\u6E05\u7684\u9886\u57DF\u91CC\u653E\u5FC3\u52A0\u7801\u2014\u2014\u90A3\u662F\u4F60\u7684\u4E3B\u573A\u3002\u4F46\u6BCF\u5E74\u7559\u4E00\u5C0F\u7B14\u94B1\u53BB\u505A\u4E00\u4EF6\u7B97\u4E0D\u6E05\u7684\u4E8B\uFF0C\u90A3\u662F\u4F60\u7684\u4FDD\u9669\u3002",
    cost: "\u7A33\u5F53\u4F1A\u8BA9\u4F60\u9519\u8FC7\u4E00\u4E9B\u53EA\u51FA\u73B0\u4E00\u6B21\u7684\u7A97\u53E3\uFF0C\u800C\u4E14\u4E8B\u540E\u4F60\u4F1A\u77E5\u9053\u3002",
    gift: "\u4F60\u5F88\u5C11\u8E29\u5927\u5751\uFF0C\u4F60\u7684\u79EF\u7D2F\u662F\u771F\u7684\u5728\u7D2F\uFF0C\u4E0D\u662F\u770B\u8D77\u6765\u5728\u7D2F\u3002"
  },
  \u4E03\u6740: {
    headline: "\u4F60\u662F\u88AB\u903C\u51FA\u6765\u7684\u90A3\u79CD\u4EBA\u3002",
    bestSelf: "\u5C40\u9762\u5F88\u7D27\u3001\u6CA1\u4EBA\u6562\u4E0A\uFF0C\u800C\u4F60\u4E0A\u4E86\u7684\u65F6\u5019\u3002",
    scenes: [
      "deadline \u524D\u4E00\u665A\u4F60\u6548\u7387\u6700\u9AD8\uFF0C\u63D0\u524D\u4E00\u4E2A\u6708\u7ED9\u4F60\uFF0C\u4F60\u53CD\u800C\u62D6\u7740\u3002",
      "\u522B\u4EBA\u8D8A\u8BF4\u300C\u8FD9\u4E8B\u633A\u96BE\u300D\uFF0C\u4F60\u8D8A\u60F3\u8BD5\u8BD5\u3002",
      "\u771F\u6B63\u628A\u4F60\u538B\u57AE\u7684\u4E0D\u662F\u96BE\uFF0C\u662F\u4E00\u4EF6\u4E8B\u4E0D\u6E05\u4E0D\u695A\u5730\u62D6\u7740\u3002"
    ],
    social: ["\u4F60\u4EA4\u670B\u53CB\u50CF\u6253\u4ED7\uFF0C\u4E00\u8D77\u625B\u8FC7\u4E8B\u7684\u624D\u7B97\u6570\u3002", "\u4F60\u4E0D\u592A\u7ECF\u8425\u5173\u7CFB\uFF0C\u6240\u4EE5\u4F60\u7684\u5173\u7CFB\u8981\u4E48\u5F88\u786C\uFF0C\u8981\u4E48\u5F88\u6DE1\u3002"],
    work: "\u4F60\u9002\u5408\u6709\u786C\u6307\u6807\u3001\u6709\u5BF9\u624B\u3001\u6709\u660E\u786E\u6218\u5F79\u7684\u4F4D\u7F6E\u3002\u76EE\u6807\u6A21\u7CCA\u3001\u8282\u594F\u6E29\u541E\u7684\u5730\u65B9\uFF0C\u4F60\u4F1A\u5148\u628A\u81EA\u5DF1\u8017\u6389\u3002",
    because: "\u300C\u4E03\u6740\u300D\u662F\u538B\u5236\u4F60\u7684\u3001\u5F3A\u786C\u7684\u529B\u91CF\u3002\u8FD9\u79CD\u7ED3\u6784\u7684\u4EBA\u4E0D\u662F\u4E0D\u6015\u538B\u529B\uFF0C\u662F\u53EA\u6709\u538B\u529B\u5230\u4E86\u624D\u542F\u52A8\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u8FC7\u5934\uFF0C\u5C31\u4F1A\u53D8\u6210\u628A\u81EA\u5DF1\u5F80\u6B7B\u91CC\u903C\uFF0C\u4E5F\u628A\u8EAB\u8FB9\u7684\u4EBA\u4E00\u8D77\u903C\uFF0C\u505A\u5B8C\u4E00\u4EF6\u4E8B\u8981\u7F13\u5F88\u4E45\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u538B\u529B\u4F1A\u53D8\u6210\u4F60\u7684\u71C3\u6599\uFF0C\u4F60\u80FD\u625B\u522B\u4EBA\u625B\u4E0D\u4F4F\u7684\u5C40\u9762\uFF0C\u4E5F\u5BB9\u6613\u5728\u5173\u952E\u6218\u5F79\u91CC\u7ACB\u529F\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u538B\u529B\u5BF9\u4F60\u6765\u8BF4\u5C31\u53EA\u662F\u538B\u529B\u2014\u2014\u625B\u4E0D\u52A8\uFF0C\u4E5F\u8EB2\u4E0D\u6389\uFF0C\u4F60\u7684\u8EAB\u4F53\u548C\u60C5\u7EEA\u4F1A\u6BD4\u8111\u5B50\u5148\u53D1\u51FA\u4FE1\u53F7\u3002",
    absent: "\u547D\u91CC\u4E03\u6740\u504F\u5C11\uFF0C\u8BF4\u660E\u4F60\u4E0D\u9760\u538B\u529B\u9A71\u52A8\uFF0C\u65E5\u5B50\u4F1A\u5E73\u987A\u4E00\u4E9B\u3002\u4EE3\u4EF7\u662F\u9047\u5230\u5FC5\u987B\u786C\u78B0\u786C\u7684\u5C40\u9762\u65F6\uFF0C\u4F60\u7F3A\u5C11\u90A3\u80A1\u8C41\u51FA\u53BB\u7684\u72E0\u52B2\u3002",
    advice: "\u4E3B\u52A8\u7ED9\u81EA\u5DF1\u8BBE\u622A\u6B62\u65F6\u95F4\u548C\u5916\u90E8\u7EA6\u675F\uFF0C\u522B\u7B49\u771F\u51FA\u4E8B\u4E86\u624D\u542F\u52A8\u3002\u4F60\u7684\u95EE\u9898\u4ECE\u6765\u4E0D\u662F\u80FD\u529B\uFF0C\u662F\u542F\u52A8\u9608\u503C\u592A\u9AD8\u3002",
    cost: "\u4F60\u4E60\u60EF\u628A\u5F26\u7EF7\u5230\u6700\u7D27\u624D\u52A8\uFF0C\u6240\u4EE5\u72B6\u6001\u662F\u4E00\u9635\u4E00\u9635\u7684\u2014\u2014\u65FA\u7684\u65F6\u5019\u5F88\u65FA\uFF0C\u584C\u4E0B\u6765\u4E5F\u662F\u6574\u5757\u584C\u3002",
    gift: "\u786C\u4ED7\u4F60\u9876\u5F97\u4F4F\u3002\u5173\u952E\u65F6\u523B\uFF0C\u8FD9\u4E00\u6761\u6BD4\u4EC0\u4E48\u90FD\u503C\u94B1\u3002"
  },
  \u6B63\u5B98: {
    headline: "\u4F60\u9700\u8981\u77E5\u9053\u8FB9\u754C\u5728\u54EA\u3002",
    bestSelf: "\u89C4\u5219\u6E05\u695A\u3001\u8D23\u4EFB\u660E\u786E\uFF0C\u4F60\u628A\u4E00\u4EF6\u88AB\u6258\u4ED8\u7684\u4E8B\u505A\u5B8C\u7684\u65F6\u5019\u3002",
    scenes: [
      "\u89C4\u5219\u4E0D\u6E05\u695A\u7684\u65F6\u5019\u4F60\u4F1A\u4E0D\u5B89\uFF0C\u5B81\u53EF\u53BB\u95EE\uFF0C\u4E5F\u4E0D\u60F3\u81EA\u5DF1\u731C\u3002",
      "\u7B54\u5E94\u8FC7\u7684\u4E8B\u4F60\u4F1A\u505A\u5230\uFF0C\u54EA\u6015\u4E2D\u9014\u5DF2\u7ECF\u540E\u6094\u4E86\u3002",
      "\u5BF9\u300C\u94BB\u7A7A\u5B50\u300D\u8FD9\u4EF6\u4E8B\uFF0C\u5C31\u7B97\u5360\u4E86\u4FBF\u5B9C\u4F60\u5FC3\u91CC\u4E5F\u4E0D\u592A\u8212\u670D\u3002"
    ],
    social: ["\u4F60\u5728\u5173\u7CFB\u91CC\u8BB2\u5206\u5BF8\uFF0C\u4E5F\u5E0C\u671B\u5BF9\u65B9\u8BB2\u3002", "\u522B\u4EBA\u8D8A\u754C\u7684\u65F6\u5019\u4F60\u4F1A\u4E0D\u8212\u670D\uFF0C\u4F46\u901A\u5E38\u4E0D\u8BF4\u51FA\u6765\u3002"],
    work: "\u4F60\u9002\u5408\u6709\u5236\u5EA6\u3001\u6709\u804C\u7EA7\u3001\u8D23\u4EFB\u8FB9\u754C\u6E05\u695A\u7684\u5730\u65B9\u2014\u2014\u5927\u516C\u53F8\u3001\u4F53\u5236\u5185\u3001\u4E13\u4E1A\u673A\u6784\u3002\u89C4\u5219\u8D8A\u660E\u786E\uFF0C\u4F60\u8D8A\u80FD\u53D1\u6325\uFF1B\u4E00\u5207\u9760\u9ED8\u5951\u7684\u5C0F\u56E2\u961F\u53CD\u800C\u4F1A\u8BA9\u4F60\u96BE\u53D7\u3002",
    because: "\u300C\u6B63\u5B98\u300D\u662F\u7EA6\u675F\u4F60\u7684\u3001\u89C4\u8303\u7684\u529B\u91CF\u3002\u6709\u6E05\u695A\u7684\u6846\u67B6\uFF0C\u4F60\u624D\u53D1\u6325\u5F97\u51FA\u6765\uFF1B\u6846\u67B6\u4E00\u6A21\u7CCA\uFF0C\u4F60\u5C31\u5148\u5F00\u59CB\u8017\u81EA\u5DF1\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u8FC7\u5934\uFF0C\u5BB9\u6613\u53D8\u5F97\u592A\u5B88\u6210\u89C4\u3001\u653E\u4E0D\u5F00\u624B\u811A\uFF0C\u660E\u660E\u53EF\u4EE5\u53D8\u901A\u7684\u4E8B\u4E5F\u786C\u625B\u7740\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u4F60\u7684\u8D23\u4EFB\u611F\u4F1A\u53D8\u6210\u4FE1\u7528\uFF0C\u522B\u4EBA\u613F\u610F\u628A\u4E8B\u4EA4\u7ED9\u4F60\uFF0C\u5347\u8FC1\u548C\u53E3\u7891\u90FD\u8DDF\u7740\u6765\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u4F60\u4F1A\u4E00\u76F4\u88AB\u89C4\u5219\u7ED1\u7740\u5374\u5F97\u4E0D\u5230\u76F8\u5E94\u7684\u4F4D\u7F6E\u2014\u2014\u4ED8\u51FA\u4E86\u8D23\u4EFB\uFF0C\u5374\u6CA1\u62FF\u5230\u6743\u9650\u3002",
    absent: "\u547D\u91CC\u6B63\u5B98\u7F3A\u5931\uFF0C\u8BF4\u660E\u4F60\u5BF9\u89C4\u5219\u79E9\u5E8F\u3001\u8D23\u4EFB\u6846\u67B6\u7684\u656C\u754F\u611F\u504F\u5C11\u3002\u4F60\u505A\u4E8B\u66F4\u4E60\u60EF\u6309\u81EA\u5DF1\u7684\u4E00\u5957\u903B\u8F91\u6765\uFF0C\u4E0D\u559C\u6B22\u88AB\u6761\u6761\u6846\u6846\u675F\u7F1A\uFF1B\u8FDB\u5165\u6709\u5C42\u7EA7\u7684\u73AF\u5883\u65F6\u5BB9\u6613\u611F\u5230\u4E0D\u81EA\u5728\u3001\u6709\u6469\u64E6\uFF0C\u53CD\u800C\u81EA\u7531\u804C\u4E1A\u6216\u81EA\u5DF1\u5E26\u9879\u76EE\u66F4\u80FD\u53D1\u6325\u3002\u4EBA\u9645\u4E0A\u4F60\u4E5F\u4E0D\u592A\u5728\u610F\u8EAB\u4EFD\u6807\u7B7E\uFF0C\u66F4\u770B\u91CD\u6C14\u573A\u5408\u4E0D\u5408\u3002",
    advice: "\u5982\u679C\u6B63\u5B98\u4E0D\u8DB3\uFF0C\u7528\u81EA\u5F8B\u4EE3\u66FF\u4ED6\u5F8B\u2014\u2014\u81EA\u5DF1\u7ED9\u81EA\u5DF1\u5B9A\u6267\u884C\u8BA1\u5212\u548C\u65F6\u95F4\u8868\uFF0C\u628A\u79E9\u5E8F\u611F\u8865\u56DE\u6765\uFF1B\u8C08\u5408\u4F5C\u6216\u5206\u5229\u7684\u65F6\u5019\uFF0C\u628A\u89C4\u5219\u63D0\u524D\u786E\u8BA4\u6E05\u695A\u3002",
    cost: "\u4F60\u4F1A\u66FF\u4E0D\u8BE5\u4F60\u62C5\u7684\u4E8B\u8D1F\u8D23\uFF0C\u800C\u4E14\u4E0D\u5BB9\u6613\u5F00\u53E3\u62D2\u7EDD\u3002",
    gift: "\u522B\u4EBA\u53EF\u4EE5\u653E\u5FC3\u628A\u4E8B\u4EA4\u7ED9\u4F60\u2014\u2014\u8FD9\u4E2A\u4FE1\u7528\u662F\u4E00\u6B21\u6B21\u6512\u51FA\u6765\u7684\uFF0C\u6512\u5F97\u6162\uFF0C\u4E5F\u5F88\u96BE\u88AB\u62FF\u8D70\u3002"
  },
  \u504F\u5370: {
    headline: "\u4F60\u5F97\u4E00\u4E2A\u4EBA\u5F85\u7740\uFF0C\u624D\u60F3\u5F97\u6E05\u695A\u3002",
    bestSelf: "\u4E00\u4E2A\u4EBA\u5F85\u7740\uFF0C\u628A\u4E00\u4E2A\u522B\u4EBA\u60F3\u4E0D\u901A\u7684\u95EE\u9898\u60F3\u901A\u7684\u65F6\u5019\u3002",
    scenes: [
      "\u70ED\u95F9\u7ED3\u675F\u4EE5\u540E\uFF0C\u4F60\u9700\u8981\u4E00\u6BB5\u72EC\u5904\u624D\u7F13\u5F97\u8FC7\u6765\u3002",
      "\u4F60\u60F3\u95EE\u9898\u7684\u8DEF\u5F84\u8DDF\u522B\u4EBA\u4E0D\u592A\u4E00\u6837\uFF0C\u89E3\u91CA\u8D77\u6765\u8D39\u52B2\uFF0C\u6240\u4EE5\u4F60\u7ECF\u5E38\u61D2\u5F97\u89E3\u91CA\u3002",
      "\u5F88\u591A\u4E8B\u4F60\u5728\u5FC3\u91CC\u8FC7\u4E86\u5F88\u591A\u904D\uFF0C\u4F46\u522B\u4EBA\u4E00\u70B9\u90FD\u770B\u4E0D\u51FA\u6765\u3002"
    ],
    social: ["\u7FA4\u804A\u91CC\u4F60\u7ECF\u5E38\u5DF2\u8BFB\u4E0D\u56DE\u2014\u2014\u4E0D\u662F\u4E0D\u60F3\u7406\uFF0C\u662F\u6CA1\u5230\u60F3\u8BF4\u8BDD\u7684\u65F6\u5019\u3002", "\u4F60\u6DF1\u4EA4\u7684\u4EBA\u5F88\u5C11\uFF0C\u4F46\u4F60\u77E5\u9053\u4ED6\u4EEC\u7684\u4E8B\u60C5\u5F88\u6DF1\u3002"],
    work: "\u4F60\u9002\u5408\u9700\u8981\u6DF1\u5EA6\u601D\u8003\u3001\u6709\u72EC\u7ACB\u7A7A\u95F4\u7684\u5DE5\u4F5C\u2014\u2014\u7814\u7A76\u3001\u8BBE\u8BA1\u3001\u6280\u672F\u3001\u521B\u4F5C\u3002\u5F00\u653E\u5DE5\u4F4D\u3001\u9891\u7E41\u4F1A\u8BAE\u3001\u968F\u65F6\u88AB\u6253\u65AD\u7684\u73AF\u5883\uFF0C\u4F1A\u8BA9\u4F60\u7684\u4F18\u52BF\u5B8C\u5168\u53D1\u6325\u4E0D\u51FA\u6765\u3002",
    because: "\u300C\u504F\u5370\u300D\u662F\u751F\u517B\u4F60\u7684\u3001\u975E\u5E38\u89C4\u7684\u529B\u91CF\u3002\u5B83\u628A\u4F60\u7684\u601D\u8003\u5F80\u91CC\u6536\uFF0C\u6240\u4EE5\u4F60\u7684\u52A0\u5DE5\u8FC7\u7A0B\u662F\u4E0D\u5916\u9732\u7684\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u8FC7\u5934\uFF0C\u5BB9\u6613\u94BB\u725B\u89D2\u5C16\u3001\u60F3\u592A\u591A\uFF0C\u628A\u81EA\u5DF1\u56F0\u5728\u8111\u5B50\u91CC\u51FA\u4E0D\u6765\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u4F60\u7684\u72EC\u7279\u89C6\u89D2\u4F1A\u53D8\u6210\u771F\u672C\u4E8B\uFF0C\u9002\u5408\u505A\u51B7\u95E8\u3001\u4E13\u7CBE\u3001\u522B\u4EBA\u505A\u4E0D\u4E86\u7684\u4E8B\uFF0C\u4E5F\u5BB9\u6613\u5728\u504F\u95E8\u9886\u57DF\u51FA\u6210\u7EE9\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u4F60\u4F1A\u89C9\u5F97\u6CA1\u4EBA\u7406\u89E3\u4F60\uFF0C\u60F3\u6CD5\u5F88\u591A\u4F46\u843D\u4E0D\u4E86\u5730\uFF0C\u4E5F\u4E0D\u592A\u613F\u610F\u53BB\u4E89\u53D6\u3002",
    absent: "\u547D\u91CC\u504F\u5370\u504F\u5C11\uFF0C\u8BF4\u660E\u4F60\u7684\u601D\u8DEF\u6BD4\u8F83\u4E3B\u6D41\u3001\u597D\u6C9F\u901A\u3002\u4EE3\u4EF7\u662F\u5C11\u4E86\u70B9\u300C\u522B\u4EBA\u60F3\u4E0D\u5230\u300D\u7684\u89D2\u5EA6\uFF0C\u4E5F\u5C11\u4E86\u72EC\u5904\u6D88\u5316\u7684\u4E60\u60EF\u2014\u2014\u60C5\u7EEA\u5BB9\u6613\u5806\u7740\u3002",
    advice: "\u7ED9\u81EA\u5DF1\u5B89\u6392\u56FA\u5B9A\u7684\u72EC\u5904\u65F6\u95F4\uFF0C\u522B\u628A\u5B83\u5F53\u5962\u4F88\u3002\u53E6\u5916\uFF0C\u628A\u60F3\u6CD5\u8BF4\u51FA\u6765\u4E00\u6B21\uFF0C\u54EA\u6015\u8BF4\u5F97\u4E0D\u5B8C\u6574\u2014\u2014\u4F60\u8111\u5B50\u91CC\u7684\u5B8C\u6574\u7248\uFF0C\u522B\u4EBA\u662F\u770B\u4E0D\u5230\u7684\u3002",
    cost: "\u4F60\u6D88\u5316\u60C5\u7EEA\u7684\u65B9\u5F0F\u662F\u5F80\u91CC\u8D70\uFF0C\u6240\u4EE5\u522B\u4EBA\u4E0D\u5BB9\u6613\u5E2E\u5230\u4F60\uFF0C\u4E5F\u5E38\u5E38\u4E0D\u77E5\u9053\u4F60\u9700\u8981\u5E2E\u3002",
    gift: "\u4F60\u80FD\u60F3\u5230\u522B\u4EBA\u60F3\u4E0D\u5230\u7684\u89D2\u5EA6\u3002\u8FD9\u4E2A\u4E0D\u662F\u52AA\u529B\u80FD\u6362\u6765\u7684\u3002"
  },
  \u6B63\u5370: {
    headline: "\u4F60\u9700\u8981\u6709\u4E2A\u53EF\u4EE5\u9000\u56DE\u53BB\u7684\u5730\u65B9\u3002",
    bestSelf: "\u80CC\u540E\u6709\u4EBA\u6258\u7740\u3001\u524D\u9762\u6709\u5148\u4F8B\uFF0C\u4F60\u653E\u5FC3\u5F80\u6DF1\u91CC\u5B66\u7684\u65F6\u5019\u3002",
    scenes: [
      "\u505A\u65B0\u7684\u4E8B\u4E4B\u524D\uFF0C\u4F60\u4F1A\u5148\u627E\u8D44\u6599\u3001\u627E\u4EBA\u95EE\u3001\u627E\u5148\u4F8B\u3002",
      "\u6709\u4EBA\u5728\u80CC\u540E\u6258\u7740\u4F60\u7684\u65F6\u5019\uFF0C\u4F60\u80FD\u53D1\u6325\u51FA\u5E73\u65F6\u770B\u4E0D\u5230\u7684\u6C34\u5E73\u3002",
      "\u4F60\u4E0D\u559C\u6B22\u88AB\u63A8\u7740\u8D70\uFF0C\u54EA\u6015\u65B9\u5411\u786E\u5B9E\u662F\u5BF9\u7684\u3002"
    ],
    social: ["\u4F60\u4FE1\u4EFB\u7684\u4EBA\u4E0D\u591A\uFF0C\u4E00\u65E6\u4FE1\u4EFB\u5C31\u5F88\u96BE\u6539\u53D8\u3002", "\u4F60\u5176\u5B9E\u66F4\u613F\u610F\u88AB\u7167\u987E\uFF0C\u53EA\u662F\u4E0D\u592A\u597D\u610F\u601D\u627F\u8BA4\u3002"],
    work: "\u4F60\u9002\u5408\u6709\u4F20\u627F\u3001\u6709\u4F53\u7CFB\u3001\u80FD\u4E00\u76F4\u5B66\u4E0B\u53BB\u7684\u9886\u57DF\u2014\u2014\u6559\u80B2\u3001\u5B66\u672F\u3001\u533B\u7597\u3001\u4E13\u4E1A\u6280\u672F\u3002\u5168\u9760\u81EA\u5DF1\u6478\u7D22\u3001\u6CA1\u4EBA\u5E26\u7684\u73AF\u5883\uFF0C\u4F60\u4F1A\u8D70\u5F97\u6BD4\u522B\u4EBA\u6162\u3002",
    because: "\u300C\u6B63\u5370\u300D\u662F\u751F\u517B\u4F60\u7684\u3001\u6B63\u7EDF\u7684\u529B\u91CF\u3002\u5B83\u7ED9\u4F60\u5B89\u5168\u611F\uFF0C\u4E5F\u8BA9\u4F60\u66F4\u4F9D\u8D56\u300C\u5148\u51C6\u5907\u597D\u300D\u8FD9\u4EF6\u4E8B\u3002",
    excess: "\u4E0D\u8FC7\u82E5\u662F\u53D1\u6325\u4E0D\u5F53\uFF0C\u5BB9\u6613\u5B89\u4E8E\u4EAB\u4E50\u3001\u7F3A\u4E4F\u8FDB\u53D6\uFF0C\u968F\u6CE2\u9010\u6D41\uFF0C\u6162\u6162\u5C31\u6CA1\u4E86\u81EA\u5DF1\u7684\u4E3B\u89C1\u3002",
    supported: "\u82E5\u5904\u4E8E\u751F\u6276\u72B6\u6001\uFF0C\u4F1A\u6709\u52A9\u4E8E\u4F60\u5728\u6559\u80B2\u3001\u5B66\u672F\u3001\u6587\u5316\u8FD9\u7C7B\u9886\u57DF\u53D1\u5C55\uFF0C\u5BB9\u6613\u5728\u8FC7\u7A0B\u4E2D\u62FF\u5230\u8BA4\u53EF\u548C\u540D\u58F0\uFF0C\u5B66\u517B\u4E5F\u4F1A\u4E00\u76F4\u5F80\u4E0A\u8D70\u3002",
    restricted: "\u82E5\u5904\u4E8E\u5236\u7EA6\u72B6\u6001\uFF0C\u4F60\u53EF\u80FD\u4F1A\u56E0\u4E3A\u73AF\u5883\u6216\u73B0\u5B9E\u95EE\u9898\uFF0C\u4E0D\u5F97\u4E0D\u505A\u51FA\u8FDD\u80CC\u672C\u5FC3\u7684\u9009\u62E9\uFF1B\u6216\u8005\u672C\u8EAB\u60F3\u8BFB\u4E66\u6C42\u5B66\uFF0C\u73B0\u5B9E\u6761\u4EF6\u5374\u652F\u6491\u4E0D\u4F4F\u3002",
    absent: "\u547D\u91CC\u6B63\u5370\u504F\u5C11\uFF0C\u8BF4\u660E\u4F60\u6CA1\u4EC0\u4E48\u53EF\u4EE5\u9000\u56DE\u53BB\u7684\u540E\u76FE\u611F\uFF0C\u51E1\u4E8B\u9760\u81EA\u5DF1\u3002\u8FD9\u8BA9\u4F60\u72EC\u7ACB\u5F97\u65E9\uFF0C\u4EE3\u4EF7\u662F\u7F3A\u4E00\u4EFD\u5E95\u6C14\u2014\u2014\u4F60\u6BD4\u522B\u4EBA\u66F4\u96BE\u5141\u8BB8\u81EA\u5DF1\u505C\u4E0B\u6765\u3002",
    advice: "\u4E3B\u52A8\u53BB\u5EFA\u7ACB\u4F60\u7684\u300C\u540E\u65B9\u300D\uFF1A\u4E00\u4E2A\u80FD\u95EE\u7684\u4EBA\u3001\u4E00\u5957\u80FD\u4F9D\u8D56\u7684\u65B9\u6CD5\u3001\u4E00\u7B14\u80FD\u515C\u5E95\u7684\u94B1\u3002\u4F60\u4E0D\u662F\u4E0D\u80FD\u9760\u81EA\u5DF1\uFF0C\u662F\u9760\u81EA\u5DF1\u592A\u4E45\u4E86\u3002",
    cost: "\u7B49\u6761\u4EF6\u9F50\u4E86\u518D\u52A8\u2014\u2014\u53EF\u6761\u4EF6\u5E38\u5E38\u4E0D\u4F1A\u9F50\u3002",
    gift: "\u4F60\u5B66\u7684\u4E1C\u897F\u662F\u624E\u5B9E\u7684\uFF0C\u4E0D\u662F\u901F\u6210\u7684\u3002\u4E09\u4E94\u5E74\u4E4B\u540E\u5DEE\u522B\u5C31\u51FA\u6765\u4E86\u3002"
  }
};

// src/engines/compose.js
var stripLead = (t) => (t || "").replace(/^「[^」]*」(是|代表|指的是|指)/, "");
var LIFE_STAGES = [
  {
    max: 12,
    key: "child",
    label: "\u7AE5\u5E74",
    context: { \u573A\u5408: "\u5B66\u6821\u548C\u5BB6\u91CC", \u540C\u4F34: "\u540C\u5B66", \u6743\u5A01: "\u8001\u5E08\u548C\u7236\u6BCD", \u4E3B\u7EBF: "\u5B66\u4E60\u548C\u73A9" }
  },
  {
    max: 22,
    key: "youth",
    label: "\u6C42\u5B66\u671F",
    context: { \u573A\u5408: "\u6821\u56ED", \u540C\u4F34: "\u540C\u5B66\u548C\u5BA4\u53CB", \u6743\u5A01: "\u8001\u5E08", \u4E3B\u7EBF: "\u5B66\u4E1A\u3001\u793E\u56E2\u548C\u7B2C\u4E00\u6279\u771F\u6B63\u7684\u670B\u53CB" }
  },
  {
    max: 30,
    key: "early",
    label: "\u7ACB\u4E1A\u671F",
    context: { \u573A\u5408: "\u804C\u573A", \u540C\u4F34: "\u540C\u4E8B", \u6743\u5A01: "\u4E0A\u7EA7", \u4E3B\u7EBF: "\u7AD9\u7A33\u811A\u8DDF\u3001\u6512\u672C\u4E8B\u3001\u4E5F\u5F00\u59CB\u8003\u8651\u957F\u671F\u5173\u7CFB" }
  },
  {
    max: 40,
    key: "mid",
    label: "\u8D1F\u91CD\u671F",
    context: { \u573A\u5408: "\u804C\u573A\u548C\u5BB6\u5EAD\u4E4B\u95F4", \u540C\u4F34: "\u540C\u4E8B\u4E0E\u5408\u4F5C\u65B9", \u6743\u5A01: "\u4F60\u81EA\u5DF1\u4E5F\u5F00\u59CB\u662F\u522B\u4EBA\u7684\u6743\u5A01", \u4E3B\u7EBF: "\u8D23\u4EFB\u53D8\u91CD\uFF0C\u9009\u62E9\u7684\u6210\u672C\u53D8\u9AD8" }
  },
  {
    max: 55,
    key: "peak",
    label: "\u5F53\u5BB6\u671F",
    context: { \u573A\u5408: "\u4F60\u8BF4\u4E86\u7B97\u7684\u5730\u65B9", \u540C\u4F34: "\u4E0B\u5C5E\u4E0E\u540C\u884C", \u6743\u5A01: "\u4F60\u81EA\u5DF1", \u4E3B\u7EBF: "\u5B88\u4F4F\u5DF2\u6709\u7684\uFF0C\u540C\u65F6\u51B3\u5B9A\u8FD8\u8981\u4E0D\u8981\u5F00\u65B0\u7684" }
  },
  {
    max: 200,
    key: "late",
    label: "\u6536\u6210\u671F",
    context: { \u573A\u5408: "\u5BB6\u91CC\u548C\u4F60\u7684\u5708\u5B50", \u540C\u4F34: "\u8001\u53CB\u4E0E\u540E\u8F88", \u6743\u5A01: "\u4E0D\u518D\u6709\u4EBA\u7BA1\u4F60", \u4E3B\u7EBF: "\u628A\u6512\u4E0B\u7684\u4E1C\u897F\u5B89\u987F\u597D" }
  }
];
var stageOf = (age) => LIFE_STAGES.find((s) => age <= s.max) || LIFE_STAGES[LIFE_STAGES.length - 1];

// src/engines/insight.js
var seq = 0;
function makeInsight({ id, title, summary, scenes = [], because = "", cost = "", gift = "", advice = "", systems = [], note = "" }) {
  return {
    id: id || `ins_${Date.now().toString(36)}_${seq++}`,
    title,
    summary,
    scenes: scenes.filter(Boolean),
    because,
    cost,
    gift,
    advice,
    confidence_language: "probabilistic",
    note,
    systems: systems.filter(Boolean)
  };
}
var SYSTEM_LABEL = {
  bazi: "\u516B\u5B57\u600E\u4E48\u770B",
  ziwei: "\u7D2B\u5FAE\u600E\u4E48\u770B",
  liuyao: "\u516D\u723B\u600E\u4E48\u770B",
  meihua: "\u6885\u82B1\u600E\u4E48\u770B"
};
var EVIDENCE_LABEL = {
  ten_god: "\u5341\u795E",
  wuxing: "\u4E94\u884C",
  pillar: "\u56DB\u67F1",
  da_yun: "\u5927\u8FD0",
  liu_nian: "\u6D41\u5E74",
  strength: "\u65E5\u4E3B\u5F3A\u5F31",
  star: "\u661F\u66DC",
  palace: "\u5BAB\u4F4D",
  mutagen: "\u56DB\u5316",
  decadal: "\u5927\u9650",
  hexagram: "\u5366\u8C61",
  yao: "\u723B",
  ti_yong: "\u4F53\u7528",
  rule: "\u89C4\u5219"
};
function ev(type, value, detail) {
  return { type, label: EVIDENCE_LABEL[type] || type, value, detail };
}

// src/engines/portrait.js
function detectConflicts(bazi, ziwei) {
  const out = [];
  const w = (god) => bazi.tenGods.find((t) => t.god === god)?.weight || 0;
  const both = (a, b) => w(a) >= 0.5 && w(b) >= 0.5;
  if (both("\u6B63\u5B98", "\u4E03\u6740")) out.push({ system: "bazi", name: "\u5B98\u6740\u6DF7\u6742", plain: "\u5BF9\u89C4\u5219\u65E2\u670D\u4ECE\u53C8\u60F3\u6323\u8131\uFF0C\u5BB9\u6613\u5728\u300C\u542C\u8BDD\u300D\u548C\u300C\u53CD\u6297\u300D\u4E4B\u95F4\u6765\u56DE\u3002", basis: "\u547D\u91CC\u6B63\u5B98\u548C\u4E03\u6740\u540C\u65F6\u90FD\u6709\u5206\u91CF\u2014\u2014\u6B63\u5B98\u662F\u89C4\u5219\uFF0C\u4E03\u6740\u662F\u538B\u529B\uFF0C\u4E24\u8005\u6027\u8D28\u76F8\u8FD1\u4F46\u4E00\u4E2A\u6E29\u548C\u4E00\u4E2A\u5F3A\u786C" });
  if (both("\u4F24\u5B98", "\u6B63\u5B98")) out.push({ system: "bazi", name: "\u4F24\u5B98\u89C1\u5B98", plain: "\u8868\u8FBE\u6B32\u548C\u5916\u90E8\u8981\u6C42\u7ECF\u5E38\u649E\u8F66\uFF0C\u5728\u6709\u4E0A\u7EA7\u7684\u73AF\u5883\u91CC\u5C24\u5176\u660E\u663E\u3002", basis: "\u547D\u91CC\u4F24\u5B98\u548C\u6B63\u5B98\u540C\u65F6\u51FA\u73B0\u2014\u2014\u4F24\u5B98\u662F\u4E0D\u670D\u7BA1\u7684\u8868\u8FBE\u6B32\uFF0C\u6B63\u5B98\u662F\u8981\u5B88\u7684\u89C4\u77E9" });
  if (both("\u6B63\u5370", "\u504F\u8D22")) out.push({ system: "bazi", name: "\u8D22\u5370\u76F8\u788D", plain: "\u60F3\u5B89\u7A33\u548C\u60F3\u6293\u673A\u4F1A\u4E92\u76F8\u62C9\u626F\uFF0C\u5E38\u5E38\u4E24\u5934\u90FD\u4E0D\u80AF\u653E\u3002", basis: "\u547D\u91CC\u6B63\u5370\u548C\u504F\u8D22\u540C\u65F6\u51FA\u73B0\u2014\u2014\u6B63\u5370\u6C42\u5B89\u7A33\uFF0C\u504F\u8D22\u6C42\u673A\u4F1A" });
  if (both("\u504F\u5370", "\u98DF\u795E")) out.push({ system: "bazi", name: "\u67AD\u795E\u593A\u98DF", plain: "\u60F3\u6CD5\u5F88\u591A\uFF0C\u4F46\u843D\u5730\u7684\u65F6\u5019\u5BB9\u6613\u88AB\u81EA\u5DF1\u5426\u6389\u3002", basis: "\u547D\u91CC\u504F\u5370\u548C\u98DF\u795E\u540C\u65F6\u51FA\u73B0\u2014\u2014\u98DF\u795E\u662F\u5F80\u5916\u505A\u51FA\u4E1C\u897F\uFF0C\u504F\u5370\u662F\u5F80\u5185\u6536\u56DE\u6765" });
  if (both("\u6BD4\u80A9", "\u6B63\u8D22") || both("\u52AB\u8D22", "\u6B63\u8D22") || both("\u52AB\u8D22", "\u504F\u8D22")) out.push({ system: "bazi", name: "\u6BD4\u52AB\u593A\u8D22", plain: "\u8D44\u6E90\u600E\u4E48\u5206\u3001\u5408\u4F5C\u600E\u4E48\u7B97\u8D26\uFF0C\u662F\u4F1A\u53CD\u590D\u51FA\u73B0\u7684\u6469\u64E6\u70B9\u3002", basis: "\u547D\u91CC\u6BD4\u80A9\u52AB\u8D22\u548C\u8D22\u661F\u540C\u65F6\u6709\u5206\u91CF\u2014\u2014\u6BD4\u52AB\u4EE3\u8868\u540C\u8F88\uFF0C\u8D22\u4EE3\u8868\u8D44\u6E90\uFF0C\u4E24\u8005\u4F1A\u4E89" });
  if (ziwei) {
    const soul = ziwei.soulMajors.map((s) => s.name);
    const PAIRS = [
      [["\u7D2B\u5FAE", "\u7834\u519B"], "\u65E2\u60F3\u5B88\u4F4F\u683C\u5C40\u53C8\u60F3\u63A8\u7FFB\u91CD\u6765\u3002"],
      [["\u5929\u673A", "\u5DE8\u95E8"], "\u60F3\u5F97\u591A\u3001\u4E5F\u8BF4\u5F97\u591A\uFF0C\u5BB9\u6613\u5148\u628A\u81EA\u5DF1\u7ED5\u8FDB\u53BB\u3002"],
      [["\u8D2A\u72FC", "\u5929\u540C"], "\u65E2\u60F3\u8981\u523A\u6FC0\u53C8\u60F3\u8981\u5B89\u9038\u3002"],
      [["\u4E03\u6740", "\u5929\u6881"], "\u65E2\u60F3\u51B2\u53C8\u60F3\u7A33\uFF0C\u884C\u52A8\u524D\u540E\u843D\u5DEE\u5927\u3002"],
      [["\u5EC9\u8D1E", "\u8D2A\u72FC"], "\u6B32\u671B\u5F3A\u5EA6\u9AD8\uFF0C\u53D6\u820D\u4E0A\u5BB9\u6613\u53CD\u590D\u3002"]
    ];
    PAIRS.forEach(([pair, plain]) => {
      if (pair.every((p) => soul.includes(p))) out.push({ system: "ziwei", name: `\u547D\u5BAB\u540C\u65F6\u6709${pair.join("\u548C")}`, plain, basis: `\u8FD9\u4E24\u9897\u661F\u6027\u8D28\u76F8\u53CD\uFF0C\u5374\u843D\u5728\u540C\u4E00\u4E2A\u5BAB\u91CC` });
    });
    const jiStar = ziwei.palaces.flatMap((p) => [...p.majorStars, ...p.minorStars].filter((s) => s.mutagen === "\u5FCC").map((s) => ({ star: s.name, palace: p.name })));
    jiStar.slice(0, 1).forEach((j) => out.push({ system: "ziwei", name: `${j.star}\u5316\u5FCC\u843D\u5728${j.palace}`, plain: `${j.palace}\u8FD9\u65B9\u9762\u5BB9\u6613\u53CD\u590D\u6295\u5165\uFF0C\u53C8\u53CD\u590D\u5361\u4F4F\u3002`, basis: "\u5316\u5FCC\u662F\u56DB\u5316\u91CC\u4EE3\u8868\u300C\u6267\u7740\u4E0E\u5361\u70B9\u300D\u7684\u90A3\u4E00\u5316\uFF0C\u5B83\u843D\u5728\u54EA\u4E00\u5BAB\uFF0C\u54EA\u4E00\u5BAB\u7684\u4E8B\u5C31\u5BB9\u6613\u7ED5\u4E0D\u5F00" }));
  }
  return out;
}

// src/engines/branches.js
var LIU_CHONG = { \u5B50: "\u5348", \u5348: "\u5B50", \u4E11: "\u672A", \u672A: "\u4E11", \u5BC5: "\u7533", \u7533: "\u5BC5", \u536F: "\u9149", \u9149: "\u536F", \u8FB0: "\u620C", \u620C: "\u8FB0", \u5DF3: "\u4EA5", \u4EA5: "\u5DF3" };
var LIU_HE = { \u5B50: "\u4E11", \u4E11: "\u5B50", \u5BC5: "\u4EA5", \u4EA5: "\u5BC5", \u536F: "\u620C", \u620C: "\u536F", \u8FB0: "\u9149", \u9149: "\u8FB0", \u5DF3: "\u7533", \u7533: "\u5DF3", \u5348: "\u672A", \u672A: "\u5348" };
var LIU_HE_WUXING = { "\u5B50\u4E11": "\u571F", "\u5BC5\u4EA5": "\u6728", "\u536F\u620C": "\u706B", "\u8FB0\u9149": "\u91D1", "\u5DF3\u7533": "\u6C34", "\u5348\u672A": "\u571F" };
var LIU_HAI = { \u5B50: "\u672A", \u672A: "\u5B50", \u4E11: "\u5348", \u5348: "\u4E11", \u5BC5: "\u5DF3", \u5DF3: "\u5BC5", \u536F: "\u8FB0", \u8FB0: "\u536F", \u7533: "\u4EA5", \u4EA5: "\u7533", \u9149: "\u620C", \u620C: "\u9149" };
var SAN_HE = [
  { zhis: ["\u7533", "\u5B50", "\u8FB0"], wuxing: "\u6C34" },
  { zhis: ["\u4EA5", "\u536F", "\u672A"], wuxing: "\u6728" },
  { zhis: ["\u5BC5", "\u5348", "\u620C"], wuxing: "\u706B" },
  { zhis: ["\u5DF3", "\u9149", "\u4E11"], wuxing: "\u91D1" }
];
var SAN_HUI = [
  { zhis: ["\u5BC5", "\u536F", "\u8FB0"], wuxing: "\u6728", season: "\u6625" },
  { zhis: ["\u5DF3", "\u5348", "\u672A"], wuxing: "\u706B", season: "\u590F" },
  { zhis: ["\u7533", "\u9149", "\u620C"], wuxing: "\u91D1", season: "\u79CB" },
  { zhis: ["\u4EA5", "\u5B50", "\u4E11"], wuxing: "\u6C34", season: "\u51AC" }
];
var XING_GROUPS = [
  { zhis: ["\u5BC5", "\u5DF3", "\u7533"], name: "\u65E0\u6069\u4E4B\u5211" },
  { zhis: ["\u4E11", "\u620C", "\u672A"], name: "\u6043\u52BF\u4E4B\u5211" },
  { zhis: ["\u5B50", "\u536F"], name: "\u65E0\u793C\u4E4B\u5211" }
];
var ZI_XING = ["\u8FB0", "\u5348", "\u9149", "\u4EA5"];
function branchRelations(a, b) {
  const out = [];
  if (LIU_CHONG[a] === b) out.push({ key: "chong", label: "\u516D\u51B2", plain: "\u4E92\u76F8\u51B2\u52A8\uFF0C\u5BB9\u6613\u5728\u540C\u4E00\u4EF6\u4E8B\u4E0A\u610F\u89C1\u76F8\u53CD", tone: -2 });
  if (LIU_HE[a] === b) out.push({ key: "he", label: "\u516D\u5408", plain: `\u5F7C\u6B64\u62C9\u8FD1\u3001\u5BB9\u6613\u9ECF\u5728\u4E00\u8D77\uFF08\u5408\u5316${LIU_HE_WUXING[[a, b].sort().join("") in LIU_HE_WUXING ? [a, b].sort().join("") : Object.keys(LIU_HE_WUXING).find((k) => k.includes(a) && k.includes(b))] || ""}\uFF09`, tone: 2 });
  if (LIU_HAI[a] === b) out.push({ key: "hai", label: "\u516D\u5BB3", plain: "\u597D\u610F\u5BB9\u6613\u88AB\u8BEF\u89E3\uFF0C\u6469\u64E6\u6765\u81EA\u7EC6\u8282", tone: -1 });
  SAN_HE.forEach((g) => {
    if (g.zhis.includes(a) && g.zhis.includes(b) && a !== b) out.push({ key: "sanhe", label: `\u534A\u5408${g.wuxing}\u5C40`, plain: `\u540C\u5C5E${g.zhis.join("")}\u4E09\u5408\uFF0C\u505A\u540C\u4E00\u7C7B\u4E8B\u65F6\u5BB9\u6613\u534F\u540C`, tone: 2 });
  });
  SAN_HUI.forEach((g) => {
    if (g.zhis.includes(a) && g.zhis.includes(b) && a !== b) out.push({ key: "sanhui", label: `${g.season}\u65B9\u4F1A`, plain: `\u540C\u5C5E${g.season}\u65B9${g.zhis.join("")}\uFF0C\u6C14\u8D28\u65B9\u5411\u63A5\u8FD1`, tone: 1 });
  });
  XING_GROUPS.forEach((g) => {
    if (g.zhis.includes(a) && g.zhis.includes(b) && a !== b) out.push({ key: "xing", label: `\u76F8\u5211\uFF08${g.name}\uFF09`, plain: "\u4EB2\u8FD1\u4E4B\u540E\u53CD\u800C\u5BB9\u6613\u4E92\u76F8\u6D88\u8017", tone: -2 });
  });
  if (a === b && ZI_XING.includes(a)) out.push({ key: "zixing", label: "\u81EA\u5211", plain: "\u540C\u4E00\u79CD\u6027\u683C\u7279\u5F81\u5728\u4E24\u4EBA\u8EAB\u4E0A\u88AB\u653E\u5927", tone: -1 });
  if (a === b && !ZI_XING.includes(a)) out.push({ key: "same", label: "\u540C\u652F", plain: "\u6027\u683C\u5E95\u8272\u63A5\u8FD1\uFF0C\u597D\u5904\u4E0E\u77ED\u677F\u4E5F\u63A5\u8FD1", tone: 1 });
  return out;
}
function branchSetRelations(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      branchRelations(list[i].zhi, list[j].zhi).filter((r) => r.key !== "same").forEach((r) => out.push({ ...r, between: [list[i], list[j]], pair: `${list[i].zhi}${list[j].zhi}` }));
    }
  }
  const zhis = list.map((x) => x.zhi);
  SAN_HE.forEach((g) => {
    if (g.zhis.every((z) => zhis.includes(z))) out.push({ key: "sanhe_full", label: `\u4E09\u5408${g.wuxing}\u5C40`, plain: `${g.zhis.join("")}\u4E09\u652F\u9F50\u5168\uFF0C${g.wuxing}\u7684\u529B\u91CF\u5728\u547D\u5C40\u4E2D\u88AB\u663E\u8457\u52A0\u5F3A`, tone: 3, pair: g.zhis.join("") });
  });
  SAN_HUI.forEach((g) => {
    if (g.zhis.every((z) => zhis.includes(z))) out.push({ key: "sanhui_full", label: `${g.season}\u65B9\u4F1A\u5C40`, plain: `${g.zhis.join("")}\u4E09\u652F\u9F50\u5168\uFF0C\u6574\u4F53\u6C14\u8D28\u5F3A\u70C8\u504F\u5411${g.wuxing}`, tone: 3, pair: g.zhis.join("") });
  });
  return out;
}

// src/engines/timeline.js
var CHONG = { \u5B50: "\u5348", \u5348: "\u5B50", \u4E11: "\u672A", \u672A: "\u4E11", \u5BC5: "\u7533", \u7533: "\u5BC5", \u536F: "\u9149", \u9149: "\u536F", \u8FB0: "\u620C", \u620C: "\u8FB0", \u5DF3: "\u4EA5", \u4EA5: "\u5DF3" };
var LEVELS = [
  { key: "calm", label: "\u5E73\u7A33", color: "var(--t3)", min: -99 },
  { key: "notice", label: "\u503C\u5F97\u5173\u6CE8", color: "var(--azure)", min: 2 },
  { key: "active", label: "\u6D3B\u8DC3", color: "var(--jade)", min: 4 },
  { key: "shift", label: "\u53D8\u5316\u8F83\u591A", color: "var(--gold)", min: 6 }
];
var levelOf = (score) => [...LEVELS].reverse().find((l) => score >= l.min) || LEVELS[0];
function baziDomainScore(bazi, gz, gender) {
  const acc = {};
  const why = {};
  DOMAINS.forEach((d) => {
    acc[d.key] = 0;
    why[d.key] = [];
  });
  const add = (k, n, reason) => {
    acc[k] += n;
    why[k].push(reason);
  };
  const gods = [gz.shiShenGan, gz.shiShenZhi].filter(Boolean);
  gods.forEach((g) => {
    if (g === "\u6B63\u5B98" || g === "\u4E03\u6740") add("career", 2, `${gz.ganZhi} \u89C1${g}\uFF0C\u8D23\u4EFB\u4E0E\u4F4D\u7F6E\u7684\u5206\u91CF\u52A0\u91CD`);
    if (g === "\u6B63\u8D22" || g === "\u504F\u8D22") add("wealth", 2, `${gz.ganZhi} \u89C1${g}\uFF0C\u4E0E\u94B1\u548C\u8D44\u6E90\u76F8\u5173\u7684\u52A8\u4F5C\u53D8\u591A`);
    if (g === "\u98DF\u795E" || g === "\u4F24\u5B98") {
      add("creation", 2, `${gz.ganZhi} \u89C1${g}\uFF0C\u8868\u8FBE\u4E0E\u4EA7\u51FA\u7684\u51B2\u52A8\u53D8\u5F3A`);
      add("career", 1, `${g} \u4E5F\u4F1A\u63A8\u52A8\u4E8B\u4E1A\u4E0A\u7684\u81EA\u4E3B\u5C1D\u8BD5`);
    }
    if (g === "\u6BD4\u80A9" || g === "\u52AB\u8D22") {
      add("relation", 1, `${gz.ganZhi} \u89C1${g}\uFF0C\u540C\u8F88\u4E0E\u5408\u4F5C\u5173\u7CFB\u4E0A\u7684\u4E92\u52A8\u589E\u52A0`);
      add("wealth", 1, `${g} \u5E38\u4F34\u968F\u8D44\u6E90\u5206\u914D\u4E0A\u7684\u6469\u64E6`);
    }
    if (g === "\u6B63\u5370" || g === "\u504F\u5370") add("body", 1, `${gz.ganZhi} \u89C1${g}\uFF0C\u504F\u5411\u4F11\u6574\u3001\u5B66\u4E60\u4E0E\u5185\u5728\u6D88\u5316`);
    if (gender === "\u5973" && (g === "\u6B63\u5B98" || g === "\u4E03\u6740")) add("relation", 2, `\u5973\u547D\u4EE5\u5B98\u6740\u4E3A\u4F34\u4FA3\u661F\uFF0C${gz.ganZhi} \u89C1${g}`);
    if (gender !== "\u5973" && (g === "\u6B63\u8D22" || g === "\u504F\u8D22")) add("relation", 2, `\u7537\u547D\u4EE5\u8D22\u661F\u4E3A\u4F34\u4FA3\u661F\uFF0C${gz.ganZhi} \u89C1${g}`);
  });
  const dayZhi = bazi.pillars[2].zhi, yearZhi = bazi.pillars[0].zhi;
  if (CHONG[gz.zhi] === dayZhi) add("move", 3, `${gz.zhi} \u51B2\u65E5\u652F ${dayZhi}\uFF0C\u4E0E\u81EA\u8EAB\u5904\u5883\u76F8\u5173\u7684\u53D8\u52A8\u4FE1\u53F7`);
  if (CHONG[gz.zhi] === yearZhi) add("move", 2, `${gz.zhi} \u51B2\u5E74\u652F ${yearZhi}\uFF0C\u4E0E\u73AF\u5883\u3001\u6839\u57FA\u76F8\u5173\u7684\u53D8\u52A8\u4FE1\u53F7`);
  const drain = gods.filter((g) => ["\u6B63\u5B98", "\u4E03\u6740", "\u98DF\u795E", "\u4F24\u5B98", "\u6B63\u8D22", "\u504F\u8D22"].includes(g)).length;
  if (bazi.strength.label === "\u504F\u5F31" && drain >= 2) add("body", 2, `\u65E5\u4E3B\u504F\u5F31\uFF0C\u800C ${gz.ganZhi} \u4E24\u4F4D\u90FD\u5C5E\u8017\u8EAB\u4E00\u7C7B\uFF0C\u8282\u594F\u5BB9\u6613\u8FC7\u8F7D`);
  if (bazi.strength.favor.includes(gz.wuxing[0]) || bazi.strength.favor.includes(gz.wuxing[1])) add("body", 1, `${gz.ganZhi} \u7684\u4E94\u884C\uFF08${gz.wuxing.join("/")}\uFF09\u843D\u5728\u65E5\u4E3B\u6240\u559C\u7684 ${bazi.strength.favor.join("\u3001")} \u4E0A`);
  return { acc, why };
}
function ziweiDomainScore(ziwei, at, useDecadal) {
  const acc = {};
  const why = {};
  DOMAINS.forEach((d) => {
    acc[d.key] = 0;
    why[d.key] = [];
  });
  if (!ziwei) return { acc, why, mutagens: [] };
  const add = (k, n, reason) => {
    if (!(k in acc)) return;
    acc[k] += n;
    why[k].push(reason);
  };
  const part = useDecadal ? at.decadal : at.yearly;
  const dom = PALACE_DOMAIN[part.palaceName];
  if (dom) add(dom, 2, `${useDecadal ? "\u5927\u9650" : "\u6D41\u5E74"}\u547D\u5BAB\u843D\u672C\u547D${part.palaceName}\u5BAB\uFF0C\u8BE5\u9636\u6BB5\u91CD\u5FC3\u504F\u5411\u6B64\u5904`);
  const mutagens = locateMutagens(ziwei, part.mutagen);
  mutagens.forEach((m) => {
    const d = PALACE_DOMAIN[m.palace];
    if (!d) return;
    add(d, m.type === "\u5FCC" ? 2 : 1, `${part.ganZhi} \u4F7F ${m.star} \u5316${m.type}\uFF0C\u843D${m.palace}\u5BAB \u2014 ${m.meaning.plain}`);
  });
  return { acc, why, mutagens };
}
function explainYear(bazi, ziwei, gender, year) {
  const { daYun, liuNian } = baziAtYear(bazi, year);
  const age = year - bazi.solar.y;
  const stage = stageOf(age);
  const at = ziwei ? ziweiAtYear(ziwei, year) : null;
  const b = baziDomainScore(bazi, liuNian, gender);
  const bStage = daYun ? baziDomainScore(bazi, { ganZhi: daYun.ganZhi, zhi: daYun.zhi, shiShenGan: daYun.shiShenGan, shiShenZhi: daYun.shiShenZhi, wuxing: daYun.wuxing }, gender) : null;
  const z = ziweiDomainScore(ziwei, at, false);
  const domains = DOMAINS.map((d) => {
    const bs = b.acc[d.key] + (bStage ? bStage.acc[d.key] * 0.5 : 0);
    const zs = z.acc[d.key];
    return { ...d, baziScore: bs, ziweiScore: zs, score: bs + zs, level: levelOf(bs + zs), baziWhy: [...b.why[d.key], ...bStage ? bStage.why[d.key].map((x) => `\uFF08\u5927\u8FD0\uFF09${x}`) : []], ziweiWhy: z.why[d.key] };
  });
  const marked = domains.filter((d) => d.score >= 2).sort((a, c) => c.score - a.score);
  const consensus = domains.filter((d) => d.baziScore >= 2 && d.ziweiScore >= 2);
  const divergence = domains.filter((d) => d.baziScore >= 2 && d.ziweiScore === 0 || d.ziweiScore >= 2 && d.baziScore === 0);
  const insight = makeInsight({
    title: `${year} \u5E74`,
    summary: marked.length ? `${year} \u5E74\u4F60 ${age} \u5C81\uFF0C\u6B63\u5728${stage.label}\u3002\u8FD9\u4E00\u5E74\u7684\u4FE1\u53F7\u96C6\u4E2D\u5728${marked.slice(0, 2).map((d) => d.label).join("\u548C")}\u4E0A\u2014\u2014\u5728${stage.context.\u573A\u5408}\u8FD9\u4E2A\u9636\u6BB5\uFF0C\u5B83\u591A\u534A\u4F53\u73B0\u4E3A\u8DDF${stage.context.\u4E3B\u7EBF}\u6709\u5173\u7684\u4E8B\u3002\u547D\u76D8\u53EA\u80FD\u8BF4\u8FD9\u51E0\u5904\u300C\u6709\u8BDD\u53EF\u8BB2\u300D\uFF0C\u5177\u4F53\u53D1\u751F\u4EC0\u4E48\u8FD8\u662F\u770B\u4F60\u600E\u4E48\u8D70\u3002` : `${year} \u5E74\u4F60 ${age} \u5C81\uFF0C\u516D\u4E2A\u65B9\u9762\u90FD\u6CA1\u6709\u7279\u522B\u96C6\u4E2D\u7684\u4FE1\u53F7\uFF0C\u662F\u547D\u76D8\u4E0A\u6BD4\u8F83\u5B89\u9759\u7684\u4E00\u5E74\u3002\u5B89\u9759\u672A\u5FC5\u662F\u574F\u4E8B\u2014\u2014${stage.label}\u91CC\uFF0C\u6CA1\u6709\u5927\u52A8\u9759\u7684\u5E74\u4EFD\u5F80\u5F80\u662F\u6512\u4E1C\u897F\u7684\u5E74\u4EFD\u3002`,
    systems: [
      {
        system: "bazi",
        label: SYSTEM_LABEL.bazi,
        interpretation: `${daYun ? `\u4F60\u73B0\u5728\u8D70\u7684\u662F ${daYun.ganZhi} \u5927\u8FD0\uFF0C\u8986\u76D6 ${daYun.startAge} \u5230 ${daYun.endAge} \u5C81\uFF0C\u8FD9\u662F\u8FD9\u5341\u5E74\u7684\u5927\u80CC\u666F\u3002` : ""}${year} \u5E74\u672C\u8EAB\u914D\u7684\u662F ${liuNian.ganZhi}\uFF0C\u8DDF\u4F60\u7684\u65E5\u4E3B\u4E00\u6BD4\u662F${[liuNian.shiShenGan, liuNian.shiShenZhi].filter(Boolean).join("\u548C")}\u3002${liuNian.shiShenGan && TEN_GODS_FULL[liuNian.shiShenGan] ? `${liuNian.shiShenGan}\u4EE3\u8868\u7684\u662F${stripLead(TEN_GODS_FULL[liuNian.shiShenGan].because)}` : ""}\u8FD9\u4E00\u5E74\u4F60 ${age} \u5C81\uFF0C\u6B63\u5904\u5728${stage.label}\uFF0C\u6240\u4EE5\u8FD9\u4E9B\u4FE1\u53F7\u591A\u534A\u4F1A\u843D\u5728${stage.context.\u573A\u5408}\uFF0C\u6216\u8005\u8DDF${stage.context.\u540C\u4F34}\u6709\u5173\u7684\u4E8B\u60C5\u4E0A\u2014\u2014${stage.context.\u4E3B\u7EBF}\u3002`,
        evidence: [
          daYun && ev("da_yun", `${daYun.ganZhi}\uFF08${daYun.startAge}\u2013${daYun.endAge} \u5C81\uFF09`, `\u4E0E\u65E5\u4E3B\u6BD4\u5BF9\u540E\u662F ${[daYun.shiShenGan, daYun.shiShenZhi].filter(Boolean).join(" / ")}`),
          ev("liu_nian", `${year} \u5E74 ${liuNian.ganZhi}`, `\u4E0E\u65E5\u4E3B\u6BD4\u5BF9\u540E\u662F ${[liuNian.shiShenGan, liuNian.shiShenZhi].filter(Boolean).join(" / ")}\uFF0C\u4E94\u884C\u5C5E ${liuNian.wuxing.join("\u3001")}`),
          ev("strength", `\u65E5\u4E3B${bazi.strength.label}\uFF0C\u559C ${bazi.strength.favor.join("\u3001")}`, bazi.strength.basis),
          ...domains.filter((d) => d.baziWhy.length).slice(0, 3).map((d) => ev("rule", d.label, d.baziWhy[0]))
        ].filter(Boolean)
      },
      ziwei && at && {
        system: "ziwei",
        label: SYSTEM_LABEL.ziwei,
        interpretation: `\u7D2B\u5FAE\u8FD9\u8FB9\uFF0C\u4F60 ${at.decadal.range.join("\u2013")} \u5C81\u8FD9\u5341\u5E74\u7684\u5927\u9650\u8D70\u5728${at.decadal.palaceName}\u5BAB\uFF0C\u4E5F\u5C31\u662F\u8BF4\u8FD9\u5341\u5E74\u7684\u91CD\u5FC3\u504F\u5411${at.decadal.palaceName}\u8FD9\u4E00\u5757\u3002${year} \u8FD9\u4E00\u5E74\u5219\u843D\u5728${at.yearly.palaceName}\u5BAB\u3002`,
        evidence: [
          ev("decadal", `\u5927\u9650 ${at.decadal.ganZhi} \xB7 ${at.decadal.palaceName}\u5BAB`, `${at.decadal.range.join("\u2013")} \u5C81`),
          ev("palace", `\u6D41\u5E74\u547D\u5BAB\u843D ${at.yearly.palaceName}`, `\u6D41\u5E74\u5E72\u652F ${at.yearly.ganZhi}`),
          ...z.mutagens.map((m) => ev("mutagen", `${m.star} \u5316${m.type} \u843D${m.palace}`, m.meaning.plain))
        ]
      }
    ]
  });
  return {
    year,
    age: year - bazi.solar.y,
    daYun,
    liuNian,
    at,
    domains,
    marked,
    consensus,
    divergence,
    insight,
    consensusText: consensus.length ? `\u516B\u5B57\u548C\u7D2B\u5FAE\u8FD9\u4E24\u5957\u5B8C\u5168\u4E0D\u540C\u7684\u4F53\u7CFB\uFF0C\u90FD\u628A\u8FD9\u4E00\u5E74\u7684${consensus.map((d) => d.label).join("\u3001")}\u6807\u4E86\u51FA\u6765\u3002\u4E24\u8FB9\u72EC\u7ACB\u7B97\u51FA\u540C\u4E00\u4E2A\u65B9\u5411\uFF0C\u8FD9\u79CD\u91CD\u5408\u503C\u5F97\u591A\u770B\u4E00\u773C\u3002` : "\u516B\u5B57\u548C\u7D2B\u5FAE\u6CA1\u6709\u5728\u540C\u4E00\u4E2A\u65B9\u9762\u540C\u65F6\u7ED9\u51FA\u660E\u663E\u4FE1\u53F7\u3002\u8FD9\u4E0D\u662F\u77DB\u76FE\uFF0C\u53EA\u662F\u4E24\u5957\u4F53\u7CFB\u5173\u6CE8\u7684\u4E1C\u897F\u672C\u6765\u5C31\u4E0D\u4E00\u6837\u3002",
    divergenceText: divergence.length ? divergence.map((d) => `${d.label}\u8FD9\u4E00\u9879\uFF0C${d.baziScore >= 2 ? `\u516B\u5B57\u6709\u4FE1\u53F7\uFF08${d.baziWhy[0] || ""}\uFF09\uFF0C\u7D2B\u5FAE\u8FD9\u4E00\u5E74\u5374\u6CA1\u6307\u5411\u8FD9\u91CC` : `\u7D2B\u5FAE\u6709\u4FE1\u53F7\uFF08${d.ziweiWhy[0] || ""}\uFF09\uFF0C\u516B\u5B57\u8FD9\u4E00\u5E74\u5374\u6CA1\u6307\u5411\u8FD9\u91CC`}`).join("\uFF1B") + "\u3002\u5206\u6B67\u672C\u8EAB\u4E5F\u662F\u4FE1\u606F\uFF1A\u8BF4\u660E\u8FD9\u4EF6\u4E8B\u6CA1\u6709\u90A3\u4E48\u786E\u5B9A\u3002" : "\u4E24\u5957\u4F53\u7CFB\u5728\u5404\u65B9\u9762\u90FD\u6CA1\u6709\u660E\u663E\u5BF9\u7ACB\u3002"
  };
}

// src/engines/signals.js
function chartSignals(bazi, ziwei) {
  const out = [];
  const push = (group, label, value, detail = "") => out.push({ group, label, value, detail });
  push("\u65E5\u4E3B", `${bazi.dayMaster.gan}\uFF08${bazi.dayMaster.wuxing}\uFF09`, bazi.strength.label, `${bazi.strength.basis}\u559C ${bazi.strength.favor.join("\u3001")}`);
  const wx = Object.entries(bazi.wuxingPct || {}).sort((a, b) => b[1] - a[1]);
  if (wx.length) {
    push("\u4E94\u884C", "\u6700\u65FA", `${wx[0][0]} ${wx[0][1]}%`);
    const weak = wx[wx.length - 1];
    push("\u4E94\u884C", weak[1] === 0 ? "\u7F3A" : "\u6700\u5F31", `${weak[0]} ${weak[1]}%`);
  }
  const dist = analyzeDistribution(bazi);
  dist.strong.forEach((s) => push("\u5341\u795E", "\u504F\u91CD", `${s.god} ${s.pct}%`));
  if (dist.absent.length) push("\u5341\u795E", "\u7F3A\u5931", dist.absent.map((s) => s.god).join("\u3001"));
  if (dist.scarce.length) push("\u5341\u795E", "\u504F\u5C11", dist.scarce.map((s) => `${s.god} ${s.pct}%`).join("\u3001"));
  if (dist.monthGod && dist.monthGod !== "\u65E5\u4E3B") push("\u5341\u795E", "\u6708\u4EE4\u900F\u51FA", dist.monthGod);
  branchSetRelations(bazi.pillars.map((p) => ({ zhi: p.zhi, pos: p.pos }))).forEach((r) => {
    push("\u5E72\u652F", r.label, `${r.pair}${r.between ? `\uFF08${r.between.map((b) => b.pos).join("")}\u67F1\uFF09` : ""}`, r.plain);
  });
  if (ziwei) {
    const star = (s) => `${s.name}${s.brightness ? `(${s.brightness})` : ""}${s.mutagen ? `\u5316${s.mutagen}` : ""}`;
    push("\u7D2B\u5FAE", "\u4E94\u884C\u5C40", ziwei.fiveElementsClass);
    push("\u7D2B\u5FAE", "\u547D\u5BAB", `${ziwei.soulPalace.stem}${ziwei.soulPalace.branch} \xB7 ${ziwei.soulMajors.map(star).join("\u3001") || "\u65E0\u4E3B\u661F"}${ziwei.borrowedFrom ? `\uFF08\u501F${ziwei.borrowedFrom}\uFF09` : ""}`);
    const body = ziwei.palaces.find((p) => p.isBody);
    if (body) push("\u7D2B\u5FAE", "\u8EAB\u5BAB", `${body.name} \xB7 ${body.majorStars.filter((s) => s.isMajor).map(star).join("\u3001") || "\u65E0\u4E3B\u661F"}`);
    ["\u5B98\u7984", "\u8D22\u5E1B", "\u592B\u59BB", "\u8FC1\u79FB", "\u75BE\u5384", "\u798F\u5FB7"].forEach((n) => {
      const p = ziwei.palaces.find((x) => x.name === n);
      if (p) push("\u7D2B\u5FAE", `${n}\u5BAB`, p.majorStars.filter((s) => s.isMajor).map(star).join("\u3001") || "\u65E0\u4E3B\u661F");
    });
    ziwei.palaces.forEach((p) => [...p.majorStars, ...p.minorStars].filter((s) => s.mutagen).forEach((s) => push("\u7D2B\u5FAE", `\u5316${s.mutagen}`, `${s.name} \u5728${p.name}`)));
  }
  detectConflicts(bazi, ziwei).forEach((c) => push("\u5F20\u529B", c.name, c.plain, c.basis));
  return out;
}
function yearSignals(bazi, ziwei, gender, year) {
  if (!bazi?.daYun?.length) return null;
  const ey = explainYear(bazi, ziwei, gender, year);
  const ss = [ey.liuNian.shiShenGan, ey.liuNian.shiShenZhi].filter(Boolean).join("/");
  return {
    year,
    age: ey.age,
    stage: stageOf(ey.age).label,
    daYun: ey.daYun ? `${ey.daYun.ganZhi}\uFF08${ey.daYun.startAge}\u2013${ey.daYun.endAge} \u5C81\uFF09` : null,
    liuNian: `${ey.liuNian.ganZhi}${ss ? `\uFF08\u5BF9\u65E5\u4E3B\u4E3A ${ss}\uFF09` : ""}`,
    ziweiYear: ey.at ? `\u5927\u9650\u8D70${ey.at.decadal.palaceName}\u5BAB\uFF0C\u6D41\u5E74\u843D${ey.at.yearly.palaceName}\u5BAB` : null,
    domains: DOMAINS.map((d) => {
      const dom = ey.domains.find((x) => x.key === d.key);
      return { key: d.key, label: d.label, level: dom.level.label, color: dom.level.color, score: dom.score, why: [...dom.baziWhy, ...dom.ziweiWhy].slice(0, 3) };
    }),
    consensus: ey.consensus.map((d) => d.label),
    divergence: ey.divergence.map((d) => d.label)
  };
}
var signalsToText = (list) => list.map((s) => `- ${s.group}\uFF5C${s.label}\uFF1A${s.value}${s.detail ? `\uFF08${s.detail}\uFF09` : ""}`).join("\n");
var yearToText = (ys) => ys ? [
  `${ys.year} \u5E74\uFF0C${ys.age} \u5C81\uFF0C${ys.stage}\u3002${ys.daYun ? `\u5927\u8FD0 ${ys.daYun}\uFF0C` : ""}\u6D41\u5E74 ${ys.liuNian}\u3002${ys.ziweiYear ? `\u7D2B\u5FAE\uFF1A${ys.ziweiYear}\u3002` : ""}`,
  ...ys.domains.map((d) => `- ${d.label}\uFF1A${d.level}${d.why.length ? `\u2014\u2014${d.why.join("\uFF1B")}` : ""}`),
  ys.consensus.length ? `\u4E24\u5957\u4F53\u7CFB\u90FD\u6807\u51FA\u7684\uFF1A${ys.consensus.join("\u3001")}` : "\u4E24\u5957\u4F53\u7CFB\u6CA1\u6709\u540C\u65F6\u6807\u51FA\u540C\u4E00\u65B9\u9762",
  ys.divergence.length ? `\u53EA\u6709\u4E00\u5957\u4F53\u7CFB\u6807\u51FA\u7684\uFF1A${ys.divergence.join("\u3001")}` : ""
].filter(Boolean).join("\n") : "";

// src/data/trigrams.js
var TRIGRAMS = {
  qian: { key: "qian", name: "\u4E7E", symbol: "\u2630", nature: "\u5929", wuxing: "\u91D1", bits: [1, 1, 1], num: 1, trait: "\u521A\u5065\u3001\u4E3B\u52A8\u3001\u5F00\u521B" },
  dui: { key: "dui", name: "\u5151", symbol: "\u2631", nature: "\u6CFD", wuxing: "\u91D1", bits: [1, 1, 0], num: 2, trait: "\u559C\u60A6\u3001\u6C9F\u901A\u3001\u53E3\u820C" },
  li: { key: "li", name: "\u79BB", symbol: "\u2632", nature: "\u706B", wuxing: "\u706B", bits: [1, 0, 1], num: 3, trait: "\u660E\u4EAE\u3001\u5916\u663E\u3001\u4F9D\u9644" },
  zhen: { key: "zhen", name: "\u9707", symbol: "\u2633", nature: "\u96F7", wuxing: "\u6728", bits: [1, 0, 0], num: 4, trait: "\u9707\u52A8\u3001\u884C\u52A8\u3001\u7A81\u53D1" },
  xun: { key: "xun", name: "\u5DFD", symbol: "\u2634", nature: "\u98CE", wuxing: "\u6728", bits: [0, 1, 1], num: 5, trait: "\u6E17\u900F\u3001\u67D4\u987A\u3001\u53CD\u590D" },
  kan: { key: "kan", name: "\u574E", symbol: "\u2635", nature: "\u6C34", wuxing: "\u6C34", bits: [0, 1, 0], num: 6, trait: "\u9669\u9677\u3001\u6D41\u52A8\u3001\u667A\u8C0B" },
  gen: { key: "gen", name: "\u826E", symbol: "\u2636", nature: "\u5C71", wuxing: "\u571F", bits: [0, 0, 1], num: 7, trait: "\u505C\u6B62\u3001\u7A33\u56FA\u3001\u963B\u9694" },
  kun: { key: "kun", name: "\u5764", symbol: "\u2637", nature: "\u5730", wuxing: "\u571F", bits: [0, 0, 0], num: 8, trait: "\u627F\u8F7D\u3001\u5305\u5BB9\u3001\u79EF\u7D2F" }
};
var TRIGRAM_LIST = Object.values(TRIGRAMS);
var TRIGRAM_BY_NUM = {};
TRIGRAM_LIST.forEach((t) => {
  TRIGRAM_BY_NUM[t.num] = t;
});
var BITS_INDEX = {};
TRIGRAM_LIST.forEach((t) => {
  BITS_INDEX[t.bits.join("")] = t;
});

// src/engines/liuyao.js
var PALACE_ORDER = ["qian", "dui", "li", "zhen", "xun", "kan", "gen", "kun"];
var POS_LABEL = ["\u672C\u5BAB", "\u4E00\u4E16", "\u4E8C\u4E16", "\u4E09\u4E16", "\u56DB\u4E16", "\u4E94\u4E16", "\u6E38\u9B42", "\u5F52\u9B42"];
function buildPalaceTable() {
  const table = {};
  PALACE_ORDER.forEach((pk) => {
    const t = TRIGRAMS[pk];
    const base = [...t.bits, ...t.bits];
    const variants = [];
    const flip = (arr, idxs) => {
      const a = [...arr];
      idxs.forEach((i) => {
        a[i] = a[i] ? 0 : 1;
      });
      return a;
    };
    variants.push({ bits: base, shi: 6 });
    variants.push({ bits: flip(base, [0]), shi: 1 });
    variants.push({ bits: flip(base, [0, 1]), shi: 2 });
    variants.push({ bits: flip(base, [0, 1, 2]), shi: 3 });
    variants.push({ bits: flip(base, [0, 1, 2, 3]), shi: 4 });
    variants.push({ bits: flip(base, [0, 1, 2, 3, 4]), shi: 5 });
    const wu = flip(base, [0, 1, 2, 3, 4]);
    const you = flip(wu, [3]);
    variants.push({ bits: you, shi: 4 });
    const gui = [...t.bits, ...you.slice(3)];
    variants.push({ bits: gui, shi: 3 });
    variants.forEach((v, i) => {
      table[v.bits.join("")] = {
        palace: pk,
        palaceName: t.name,
        palaceWuxing: t.wuxing,
        posLabel: POS_LABEL[i],
        shiYao: v.shi,
        yingYao: (v.shi + 2) % 6 + 1
      };
    });
  });
  return table;
}
var PALACE_TABLE = buildPalaceTable();

// src/engines/location.js
import { Solar as Solar2 } from "lunar-javascript";

// src/dsh/facts.js
function profileFacts(profile, bazi, ziwei, corr) {
  const lines = [
    `\u6863\u6848\uFF1A${profile.name}\uFF0C${profile.gender}\uFF0C${profile.birth_date} ${profile.time_unknown ? "\u65F6\u8FB0\u4E0D\u8BE6" : profile.birth_time || ""}${corr?.applied ? `\uFF1B${corr.note}` : ""}`,
    `\u56DB\u67F1\uFF1A${bazi.pillars.map((p) => p.gan + p.zhi).join(" ")}\u3000\u65E5\u4E3B ${bazi.dayMaster.gan}\uFF08${bazi.dayMaster.wuxing}\uFF09${bazi.strength.label}\uFF0C\u559C ${bazi.strength.favor.join("\u3001")}`,
    bazi.daYun.length ? `\u5927\u8FD0\uFF1A${bazi.daYun.map((d) => `${d.ganZhi} ${d.startYear}\u2013${d.endYear}\uFF08${d.startAge}\u2013${d.endAge} \u5C81\uFF09`).join("\uFF1B")}` : "\u5927\u8FD0\uFF1A\u65E0\u6CD5\u8D77\u8FD0",
    ziwei ? `\u7D2B\u5FAE\uFF1A${ziwei.fiveElementsClass}\uFF0C\u547D\u5BAB ${ziwei.soulPalace.stem}${ziwei.soulPalace.branch} \u5750 ${ziwei.soulMajors.map((s) => s.name).join("\u3001") || "\u65E0\u4E3B\u661F"}` : "\u7D2B\u5FAE\uFF1A\u672A\u6392"
  ];
  return lines.join("\n");
}

// src/dsh/context-entry.js
function chartsOf(profile) {
  if (!profile?.birth_date) return { bazi: null, ziwei: null, corr: null };
  const corr = correctedBirth(profile);
  const args = { date: corr.date || profile.birth_date, time: corr.time || profile.birth_time, gender: profile.gender || "\u7537", timeUnknown: !!profile.time_unknown };
  return { bazi: buildBazi(args), ziwei: buildZiwei(args), corr };
}
var KEY_LABEL = (k) => {
  if (k === "reveal") return "\u547D\u76D8\u5F00\u5377\uFF08\u7B2C\u4E00\u5C4F\u7684\u7B80\u77ED\u89E3\u8BFB\uFF09";
  if (k === "who") return "\u6211\u662F\u8C01";
  if (k === "where-to") return "\u6211\u5C06\u53BB\u5411\u4F55\u65B9\uFF08\u73B0\u5728\u4E0E\u672A\u6765\u5341\u5E74\uFF09";
  if (k.startsWith("year:")) return `${k.slice(5)} \u5E74`;
  if (k.startsWith("event:")) return k.includes("#") ? `\u4E00\u4E2A\u95EE\u9898\u7684\u7B2C ${k.split("#")[1]} \u8F6E\u8FFD\u95EE` : "\u4E00\u4E2A\u95EE\u9898";
  if (k.startsWith("person:")) return "\u5408\u76D8";
  if (k.startsWith("alt:")) return "\u53E6\u4E00\u6761\u65F6\u95F4\u7EBF";
  if (k === "places") return "\u5730\u70B9\uFF08\u56FD\u5185\u7248\uFF09";
  if (k === "places:intl") return "\u5730\u70B9\uFF08\u56FD\u9645\u7248\uFF09";
  if (k.startsWith("naming:")) return "\u8D77\u540D";
  return k;
};
function contextDocument(profile, opts = {}) {
  const { bazi, ziwei, corr } = chartsOf(profile);
  const name = profile.name || "\u7528\u6237";
  const lines = [
    "# \u7384\u5B66\u4EBA\u751F\u5DE5\u4F5C\u53F0 \xB7 \u4E0A\u4E0B\u6587",
    "",
    `\u4F60\u6B63\u5728\u4E0E DSH Desktop \u7684\u300C\u7384\u5B66\u4EBA\u751F\u5DE5\u4F5C\u53F0\u300D\u534F\u4F5C\u3002\u672C\u4F1A\u8BDD\u7684\u5DE5\u4F5C\u76EE\u5F55\u5C31\u662F\u5F53\u524D\u6863\u6848\u6587\u4EF6\u5939\uFF0C\u6863\u6848\u4E3B\u4EBA\u662F **${name}**\u3002`,
    "",
    "## \u5148\u8BFB\u8FD9\u4E00\u6BB5\uFF1A\u600E\u4E48\u8BF4\u8BDD",
    "",
    "**\u8FD9\u4EFD\u6587\u6863\u662F\u5199\u7ED9\u4F60\u7684\uFF0C\u4E0D\u662F\u5199\u7ED9\u7528\u6237\u7684\u3002\u4E0D\u8981\u628A\u91CC\u9762\u7684\u89C4\u5219\u590D\u8FF0\u7ED9\u4ED6\u3002**",
    "",
    "- \u547D\u7406\u5728\u8FD9\u91CC\u662F\u4E00\u79CD**\u770B\u7ED3\u6784\u7684\u8BFB\u6CD5**\uFF0C\u4E0D\u662F\u9884\u8A00\u3002\u6240\u6709\u5224\u65AD\u90FD\u7528\u300C\u591A\u534A\u3001\u5F80\u5F80\u3001\u5BB9\u6613\u3001\u901A\u5E38\u300D\u8FD9\u7C7B\u7559\u4F59\u5730\u7684\u8BF4\u6CD5\uFF0C",
    "  \u4E0D\u8BF4\u300C\u5FC5\u7136\u3001\u4E00\u5B9A\u3001\u6CE8\u5B9A\u3001\u547D\u4E2D\u300D\uFF0C\u4E0D\u8BF4\u300C\u52AB\u3001\u707E\u3001\u51F6\u3001\u7834\u8D22\u3001\u514B\u592B\u3001\u514B\u59BB\u300D\u8FD9\u7C7B\u4F1A\u5413\u5230\u4EBA\u7684\u8BCD\u3002",
    "- **\u4E0D\u66FF\u7528\u6237\u505A\u51B3\u5B9A\u3002** \u4ED6\u95EE\u300C\u8BE5\u9009\u54EA\u4E2A\u300D\uFF0C\u4F60\u7ED9\u7684\u662F\u300C\u5982\u679C\u4F60\u66F4\u5728\u610F X\uFF0CA \u66F4\u8D34\uFF1B\u66F4\u5728\u610F Y\uFF0CB \u66F4\u8D34\u300D\uFF0C\u6700\u540E\u4E00\u53E5\u7559\u7ED9\u4ED6\u3002",
    "- **\u4E0D\u5236\u9020\u7126\u8651\u3002** \u8BB2\u5230\u4E0D\u987A\u7684\u5E74\u4EFD\u6216\u7ED3\u6784\uFF0C\u540C\u65F6\u8BB2\u6E05\u695A\u5B83\u5BF9\u5E94\u7684\u662F\u54EA\u4E00\u7C7B\u4E8B\u3001\u4EE5\u53CA\u987A\u7684\u90A3\u4E00\u9762\u5728\u54EA\uFF1B\u4E0D\u8981\u53EA\u8BF4\u574F\u7684\u3002",
    "- \u7528\u6237\u95EE\u300C\u4E3A\u4EC0\u4E48\u8FD9\u6837\u8BF4\u300D\u65F6\uFF0C\u5F15\u7528\u76D8\u9762\u4F9D\u636E\uFF08\u54EA\u4E2A\u5341\u795E\u3001\u54EA\u9897\u661F\u3001\u54EA\u4E00\u5E74\u7684\u5E72\u652F\uFF09\uFF0C\u8BF4\u6E05\u695A\u63A8\u7406\u94FE\u3002",
    "- \u8BF4\u4EBA\u8BDD\u4F46\u4FDD\u6301\u4E13\u4E1A\u514B\u5236\u3002\u300C\u4E03\u6740\u300D\u300C\u5316\u5FCC\u300D\u8FD9\u7C7B\u8BCD\u53EF\u4EE5\u7528\uFF0C\u4F46\u7B2C\u4E00\u6B21\u51FA\u73B0\u65F6\u987A\u624B\u89E3\u91CA\u4E00\u53E5\u5B83\u5728\u8FD9\u4E2A\u4EBA\u8EAB\u4E0A\u662F\u4EC0\u4E48\u6837\u3002",
    "- \u63D0\u5230\u7528\u6237\u7684\u5173\u7CFB\u4EBA\uFF0C\u4E00\u5F8B\u7528\u300C\u4F34\u4FA3\u300D\u300C\u5BB6\u4EBA\u300D\u300C\u540C\u4E8B\u300D\u300C\u670B\u53CB\u300D\u8FD9\u7C7B\u4E2D\u6027\u79F0\u8C13\uFF0C\u4E0D\u8981\u7528\u300C\u7537\u670B\u53CB\u300D\u300C\u5973\u670B\u53CB\u300D\u4E4B\u7C7B\u7684\u8BF4\u6CD5\uFF0C\u4E5F\u4E0D\u8981\u590D\u8FF0\u7528\u6237\u7684\u79C1\u4EBA\u7EC6\u8282\u53BB\u4E3E\u4F8B\u3002",
    "- \u6392\u7248\u4ECE\u7B80\uFF1A\u77ED\u6BB5\u843D\u3001`##` \u5C0F\u6807\u9898\uFF0C\u4E0D\u94FA\u5927\u8868\u683C\u3002",
    "",
    "## \u5DE5\u4F5C\u53F0\u600E\u4E48\u5206\u5DE5",
    "",
    "\u4E09\u5C42\uFF1A**\u6392\u76D8\u5F15\u64CE**\u7B97\u4E8B\u5B9E\uFF08\u56DB\u67F1\u3001\u5927\u8FD0\u6D41\u5E74\u3001\u7D2B\u5FAE\u5BAB\u4F4D\u661F\u66DC\u3001\u5366\u8C61\uFF09\uFF0C**\u89C4\u5219\u5F15\u64CE**\u6807\u4FE1\u53F7\uFF08\u5341\u795E\u504F\u91CD\u4E0E\u7F3A\u5931\u3001\u5E72\u652F\u5173\u7CFB\u3001\u56DB\u5316\u3001\u6BCF\u5E74\u516D\u4E2A\u65B9\u9762\u7684\u5F3A\u5F31\uFF09\uFF0C**\u4F60**\u5199\u771F\u6B63\u7684\u89E3\u8BFB\u3002",
    "\u5DE5\u4F5C\u53F0\u91CC\u6CA1\u6709\u9884\u5199\u7684\u89E3\u8BFB\u6587\u6848\u2014\u2014\u7528\u6237\u770B\u5230\u7684\u6BCF\u4E00\u6BB5\u89E3\u8BFB\u90FD\u662F\u4F60\u5199\u7684\u3002",
    "",
    "### \u89E3\u8BFB\u8BF7\u6C42\u600E\u4E48\u5904\u7406",
    "",
    "- \u5DE5\u4F5C\u53F0\u4F1A\u81EA\u52A8\u53D1\u6765\u4EE5 `\u3010\u5DE5\u4F5C\u53F0\u8BF7\u6C42\u89E3\u8BFB #key\u3011` \u5F00\u5934\u7684\u6D88\u606F\uFF0C\u91CC\u9762\u5DF2\u7ECF\u5E26\u597D\u4E8B\u5B9E\u548C\u4FE1\u53F7\uFF0C\u5E76\u8BF4\u660E\u4E86\u8981\u4F60\u5199\u54EA\u51E0\u4E2A\u5C0F\u6807\u9898\u3002",
    '- **\u5148\u5728\u5BF9\u8BDD\u91CC\u6B63\u5E38\u56DE\u7B54\uFF0C\u7136\u540E\u5FC5\u987B\u5199\u56DE\u6587\u4EF6**\u2014\u2014\u628A\u540C\u6837\u7684\u5185\u5BB9\u5199\u8FDB `profile.json`\uFF1A`interpretations["key"]` \u91CC\u628A `status` \u6539\u6210 `"done"`\uFF0C`text` \u586B\u4F60\u7684\u56DE\u7B54\uFF08Markdown\uFF0C`##` \u5C0F\u6807\u9898\uFF09\uFF0C`at` \u586B ISO \u65F6\u95F4\u3002**\u4E0D\u8981\u52A8 `request` \u5B57\u6BB5**\uFF0C\u4E0D\u8981\u5220\u522B\u7684 key\u3002\u5199\u5B8C\u754C\u9762\u51E0\u79D2\u5185\u81EA\u52A8\u663E\u793A\u3002',
    "- \u300C\u6211\u6709\u4E8B\u60F3\u95EE\u300D\u91CC\u7684\u8FFD\u95EE\u4E5F\u8D70\u8FD9\u6761\u8DEF\uFF1Akey \u5F62\u5982 `event:<id>#2`\u3001`#3`\uFF08\u7B2C\u51E0\u8F6E\uFF09\uFF0C\u6D88\u606F\u91CC\u5E26\u7740\u524D\u51E0\u8F6E\u7684\u95EE\u7B54\u3002**\u5199\u56DE\u5230\u6D88\u606F\u91CC\u7ED9\u7684\u90A3\u4E2A\u5E26 `#` \u7684 key**\uFF0C\u4E0D\u8981\u8986\u76D6\u7B2C\u4E00\u8F6E\u7684 `event:<id>`\u3002\u5982\u679C\u4F60\u7B2C\u4E00\u8F6E\u5728\u300C\u60F3\u5148\u95EE\u4F60\u300D\u91CC\u5411\u4ED6\u8981\u8FC7\u4FE1\u606F\uFF0C`#2` \u591A\u534A\u5C31\u662F\u4ED6\u7684\u56DE\u7B54\u3002",
    "- `\u3010\u5DE5\u5177\u9601\u3011` \u5F00\u5934\u7684\u6D88\u606F\u53EA\u9700\u8981\u5728\u5BF9\u8BDD\u91CC\u56DE\u7B54\uFF0C\u4E0D\u7528\u5199\u6587\u4EF6\u3002",
    "- \u4E8B\u5B9E\u4EE5\u6D88\u606F\u91CC\u7ED9\u7684\u4E3A\u51C6\uFF1B\u4F60\u53EF\u4EE5\u8865\u5145\u81EA\u5DF1\u7684\u547D\u7406\u77E5\u8BC6\uFF0C\u4F46\u4E0D\u8981\u6539\u5199\u4E8B\u5B9E\uFF08\u6BD4\u5982\u628A\u65E5\u4E3B\u5F3A\u5F31\u8BF4\u53CD\uFF09\u3002",
    ""
  ];
  if (!bazi) {
    lines.push("## \u5F53\u524D\u6863\u6848", "", `- ${name}\uFF1A\u8FD8\u6CA1\u6709\u51FA\u751F\u4FE1\u606F\uFF0C\u53EA\u80FD\u505A\u4E0E\u547D\u76D8\u65E0\u5173\u7684\u5BF9\u8BDD\u3002`, "");
    return `${lines.join("\n")}
`;
  }
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const ys = yearSignals(bazi, ziwei, profile.gender, year);
  lines.push("## \u5F53\u524D\u6863\u6848\uFF08\u6392\u76D8\u5F15\u64CE\uFF09", "", profileFacts(profile, bazi, ziwei, corr), "");
  lines.push("## \u4FE1\u53F7\uFF08\u89C4\u5219\u5F15\u64CE\uFF0C\u53EA\u662F\u6807\u8BB0\uFF09", "", signalsToText(chartSignals(bazi, ziwei)), "");
  if (ys) lines.push(`## \u4ECA\u5E74\uFF08${year}\uFF09\u516D\u4E2A\u65B9\u9762`, "", yearToText(ys), "");
  const interp = profile.interpretations || {};
  const pending = Object.entries(interp).filter(([, v]) => v?.status === "pending");
  const done = Object.entries(interp).filter(([, v]) => v?.status === "done");
  lines.push("## \u89E3\u8BFB\u7684\u72B6\u6001", "");
  if (pending.length) {
    lines.push("**\u7B49\u4F60\u5199\u56DE\u7684**\uFF08\u5DE5\u4F5C\u53F0\u5DF2\u7ECF\u53D1\u8FC7\u8BF7\u6C42\uFF0C\u754C\u9762\u5728\u8F6C\u5708\uFF09\uFF1A");
    pending.forEach(([k, v]) => lines.push(`- \`${k}\`\u3000${KEY_LABEL(k)}\u3000\u8BF7\u6C42\u4E8E ${v.request?.at || ""}`));
    lines.push("");
  }
  if (done.length) {
    lines.push("\u5DF2\u5199\u56DE\u7684\uFF1A" + done.map(([k]) => `\`${k}\``).join("\u3001"));
    lines.push("");
  }
  if (!pending.length && !done.length) lines.push("\u8FD8\u6CA1\u6709\u4EFB\u4F55\u89E3\u8BFB\u3002\u7528\u6237\u6253\u5F00\u67D0\u4E00\u9875\u65F6\u5DE5\u4F5C\u53F0\u4F1A\u81EA\u52A8\u53D1\u8BF7\u6C42\u3002", "");
  const qs = (profile.events || []).filter((e) => e.question || e.event_type === "question");
  lines.push("## \u4ED6\u95EE\u8FC7\u7684\u4E8B", "");
  if (!qs.length) lines.push("- \u8FD8\u6CA1\u95EE\u8FC7\u3002");
  qs.slice(0, 15).forEach((e) => {
    const st = interp[`event:${e.event_id}`]?.status;
    lines.push(`- \`event:${e.event_id}\`\u3000${e.question || e.title}\u3000${String(e.created_at || "").slice(0, 10)}\u3000${st === "done" ? "\u5DF2\u89E3\u8BFB" : st === "pending" ? "\u7B49\u4F60\u89E3\u8BFB" : "\u672A\u8BF7\u6C42"}`);
    if (e.cast?.liuyao?.text) lines.push(`  - \u516D\u723B\uFF1A${e.cast.liuyao.text}`);
    if (e.cast?.meihua?.text) lines.push(`  - \u6885\u82B1\uFF1A${e.cast.meihua.text}`);
    Object.entries(interp).filter(([k]) => k.startsWith(`event:${e.event_id}#`)).sort((a, b) => Number(a[0].split("#")[1]) - Number(b[0].split("#")[1])).forEach(([k, v]) => lines.push(`  - \u8FFD\u95EE \`${k}\`\uFF1A${v?.question || ""}\u3000${v?.status === "done" ? "\u5DF2\u7B54" : v?.status === "pending" ? "\u7B49\u4F60\u5199\u56DE" : ""}`));
    if (e.outcome?.actual_result) lines.push(`  - \u540E\u6765\uFF1A${e.outcome.actual_result}`);
  });
  lines.push("");
  const tls = (profile.timelines || []).filter((t) => t.premise);
  if (tls.length) {
    lines.push("## \u4ED6\u5206\u53C9\u8FC7\u7684\u65F6\u95F4\u7EBF", "", ...tls.map((t) => `- \`alt:${t.timeline_id}\`\u3000\u5982\u679C\u5F53\u5E74\u2026\u2026${t.premise}\uFF08${t.from_year} \u5E74\u8D77\uFF09\u3000${interp[`alt:${t.timeline_id}`]?.status === "done" ? "\u5DF2\u5199" : "\u7B49\u4F60\u5199"}`), "");
  }
  const persons = profile.persons || [];
  if (persons.length) {
    lines.push("## \u5408\u76D8\u91CC\u7684\u4EBA", "", ...persons.map((p) => `- \`person:${p.person_id}\`\u3000${p.nickname}\uFF08${p.kind}\uFF09${p.birth_date}${p.time_unknown ? " \u65F6\u8FB0\u4E0D\u8BE6" : " " + (p.birth_time || "")}${p.birth_place ? ` ${p.birth_place}` : ""}`), "");
  }
  lines.push(
    "## \u7F16\u8F91 profile.json \u7684\u89C4\u5219",
    "",
    "- `profile.json` \u662F\u5DE5\u4F5C\u53F0\u4E0E\u4F60\u5171\u7528\u7684\u552F\u4E00\u4E8B\u5B9E\u6E90\uFF0C\u4F60\u76F4\u63A5\u7F16\u8F91\u5B83\uFF0C\u754C\u9762\u51E0\u79D2\u5185\u81EA\u52A8\u5237\u65B0\u3002",
    "- **\u53EF\u4EE5\u5199**\uFF1A`interpretations[key]` \u7684 `status` / `text` / `at`\uFF1B`events[].outcome.actual_result`\uFF08\u7528\u6237\u8BF4\u4E86\u540E\u6765\u600E\u4E48\u6837\uFF09\u3002",
    "- **\u4E0D\u8981\u6539**\uFF1A\u51FA\u751F\u4FE1\u606F\u3001`birth_place`\u3001`birth_lng`\u3001`calibration`\u3001`events[].question`\u3001`events[].cast`\u3001\u4EFB\u4F55 `request` \u5B57\u6BB5\u3002",
    "- \u4E0D\u8981\u5199\u8BC4\u5206\u3001\u4E0D\u8981\u5199\u300C\u8FD0\u52BF\u5206\u300D\u2014\u2014\u5DE5\u4F5C\u53F0\u4E0D\u7ED9\u5206\u6570\uFF0C\u4F60\u4E5F\u4E0D\u8981\u7ED9\u3002",
    "- \u8FD9\u4E9B\u5B57\u6BB5\u89C4\u5219\u662F\u7ED9\u4F60\u770B\u7684\u5B9E\u73B0\u7EC6\u8282\uFF0C\u4E0D\u8981\u5FF5\u7ED9\u7528\u6237\u542C\u3002",
    ""
  );
  if (opts.folder) lines.push(`\u6863\u6848\u6587\u4EF6\u5939\uFF1A\`${opts.folder}\``, "");
  return `${lines.join("\n")}
`;
}
export {
  buildBazi,
  buildZiwei,
  chartSignals,
  chartsOf,
  contextDocument,
  correctedBirth,
  yearSignals
};
