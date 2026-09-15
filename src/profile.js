const APPLICATION_FILL_WORK_KEY = "__application_fill_work__";
const APPLICATION_FILL_INTERNSHIP_KEY = "__application_fill_internship__";
const APPLICATION_FILL_PROFILE_VERSION = 3;

const APPLICATION_FILL_DEFAULT_PROFILE = {
  profileVersion: APPLICATION_FILL_PROFILE_VERSION,
  zh: {
    sectionOrder: ["基础资料", "教育经历", APPLICATION_FILL_WORK_KEY, APPLICATION_FILL_INTERNSHIP_KEY, "项目经历", "校园活动经历", "技能", "语言能力", "证书", "奖励信息", "兴趣爱好", "个人评价", "链接与常用问答"],
    workTitle: "工作经历",
    internshipTitle: "实习经历",
    groups: {
      "基础资料": [["中文姓名", ""], ["中文姓", ""], ["中文名", ""], ["英文姓名", ""], ["英文名（Given name）", ""], ["英文姓（Family name）", ""], ["Preferred name", ""], ["性别", ""], ["出生日期", ""], ["国籍/地区", ""], ["中国大陆身份证", ""], ["香港身份证", ""], ["护照号码", ""], ["电子邮箱", ""], ["手机号", ""], ["微信号", ""], ["中文地址", ""], ["邮政编码", ""]],
      "技能": [["技能", ""], ["编程语言", "Python"], ["工具 / 软件", ""], ["证书", ""]],
      "兴趣爱好": [["兴趣爱好", ""]],
      "个人评价": [["个人评价", ""]],
      "链接与常用问答": [["LinkedIn", ""], ["GitHub", ""], ["作品集", ""], ["期望薪资", ""], ["到岗时间", ""]]
    },
    repeatableGroups: {
      "教育经历": [[["学校", ""], ["学院/系", ""], ["专业", ""], ["学位", ""], ["开始时间", ""], ["毕业时间", ""], ["GPA", ""]]],
      "项目经历": [[["项目名称", ""], ["项目角色", ""], ["职责描述", ""], ["开始时间", ""], ["结束时间", ""], ["项目描述", ""]]],
      "校园活动经历": [[["组织/社团", ""], ["职务", ""], ["开始时间", ""], ["结束时间", ""], ["经历描述", ""]]],
      "语言能力": [[["语言类型", ""], ["掌握程度", ""], ["语言证书", ""], ["成绩", ""], ["获取日期", ""]]],
      "证书": [[["证书类型", ""], ["证书名称", ""], ["生效时间", ""]]],
      "奖励信息": [[["奖励名称", ""], ["获奖时间", ""], ["授予单位", ""], ["证明人", ""]]]
    },
    variantGroups: {},
    workVariants: { "可替换不同版本": [[["公司", ""], ["职位", ""], ["开始时间", ""], ["结束时间", ""], ["工作描述", ""]]] },
    internshipVariants: { "可替换不同版本": [[["公司", ""], ["岗位", ""], ["开始时间", ""], ["结束时间", ""], ["实习描述", ""]]] }
  },
  en: {
    sectionOrder: ["Personal", "Education", APPLICATION_FILL_WORK_KEY, APPLICATION_FILL_INTERNSHIP_KEY, "Projects", "Campus activities", "Skills", "Languages", "Certificates", "Awards", "Interests", "Personal statement", "Links & common answers"],
    workTitle: "Work experience",
    internshipTitle: "Internship experience",
    groups: {
      "Personal": [["First / given name", ""], ["Last / family name", ""], ["Preferred name", ""], ["Full legal name", ""], ["Chinese name", ""], ["Gender", ""], ["Date of birth", ""], ["Nationality / region", ""], ["Mainland China ID", ""], ["Hong Kong ID", ""], ["Passport number", ""], ["Email", ""], ["Phone", ""], ["WeChat", ""], ["English address", ""], ["Postal code", ""]],
      "Skills": [["Skills", ""], ["Programming languages", "Python"], ["Tools / software", ""], ["Certificates", ""]],
      "Interests": [["Interests", ""]],
      "Personal statement": [["Personal statement", ""]],
      "Links & common answers": [["LinkedIn", ""], ["GitHub", ""], ["Portfolio", ""], ["Expected salary", ""], ["Availability", ""]]
    },
    repeatableGroups: {
      "Education": [[["School", ""], ["Faculty / department", ""], ["Major", ""], ["Degree", ""], ["Start date", ""], ["Graduation date", ""], ["GPA", ""]]],
      "Projects": [[["Project name", ""], ["Role", ""], ["Responsibilities", ""], ["Start date", ""], ["End date", ""], ["Description", ""]]],
      "Campus activities": [[["Organisation", ""], ["Role", ""], ["Start date", ""], ["End date", ""], ["Description", ""]]],
      "Languages": [[["Language", ""], ["Proficiency", ""], ["Language certificate", ""], ["Score", ""], ["Date obtained", ""]]],
      "Certificates": [[["Certificate type", ""], ["Certificate name", ""], ["Effective date", ""]]],
      "Awards": [[["Award name", ""], ["Date received", ""], ["Awarding organisation", ""], ["Referee", ""]]]
    },
    variantGroups: {},
    workVariants: { "Replaceable version": [[["Company", ""], ["Title", ""], ["Start date", ""], ["End date", ""], ["Description", ""]]] },
    internshipVariants: { "Replaceable version": [[["Company", ""], ["Title", ""], ["Start date", ""], ["End date", ""], ["Description", ""]]] }
  }
};

const applicationFillApi = globalThis.chrome ?? globalThis.browser;

function applicationFillRecords(value, fallback) {
  if (!Array.isArray(value)) return structuredClone(fallback);
  if (Array.isArray(value[0]?.[0])) return structuredClone(value);
  return [structuredClone(value)];
}

function applicationFillVariants(value, fallback) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
  return Object.fromEntries(Object.entries(source).map(([name, records]) => [name, applicationFillRecords(records, [])]));
}

function applicationFillUpgradeRecords(records, template, aliases = {}, preserveOrder = false, addMissingTemplateFields = true) {
  const templateLabels = new Set(template.map(([label]) => label));
  return records.map((record) => {
    if (preserveOrder && !addMissingTemplateFields) return record.map(([label, value]) => [label, value]);
    const values = new Map(record.map(([label, value]) => [aliases[label] || label, value]));
    if (preserveOrder) {
      const seen = new Set();
      const upgraded = [];
      for (const [label] of record) {
        const normalized = aliases[label] || label;
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        upgraded.push([normalized, values.get(normalized)]);
      }
      if (addMissingTemplateFields) for (const [label, value] of template) if (!seen.has(label)) upgraded.push([label, value]);
      return upgraded;
    }
    if (!addMissingTemplateFields) return record.map(([label]) => [aliases[label] || label, values.get(aliases[label] || label)]);
    const upgraded = template.map(([label, value]) => [label, values.has(label) ? values.get(label) : value]);
    for (const [label, value] of values) if (!templateLabels.has(label)) upgraded.push([label, value]);
    return upgraded;
  });
}

function applicationFillDateAliases(locale, title) {
  if (locale === "zh") {
    if (title === "项目经历") return { "项目日期": "开始时间", "项目职责": "职责描述" };
    if (title === "校园经历" || title === "校园活动经历" || title === "工作经历" || title === "实习经历") return { "日期": "开始时间" };
  } else if (title === "Projects" || title === "Campus activities" || title === "Work experience" || title === "Internship experience") {
    return { "Dates": "Start date" };
  }
  return {};
}

function applicationFillSectionAliases(locale) {
  return locale === "zh" ? { "校园经历": "校园活动经历" } : {};
}

function applicationFillUpgradeLanguageRecords(value, template, locale, preserveOrder = false, addMissingTemplateFields = true) {
  if (Array.isArray(value) && Array.isArray(value[0]) && !Array.isArray(value[0][0])) {
    const labels = locale === "zh" ? ["语言类型", "掌握程度"] : ["Language", "Proficiency"];
    return value.filter(([language]) => language).map(([language, proficiency]) => applicationFillUpgradeRecords([[[labels[0], language], [labels[1], proficiency]]], template, {}, preserveOrder, addMissingTemplateFields)[0]);
  }
  return applicationFillUpgradeRecords(applicationFillRecords(value, template), template, {}, preserveOrder, addMissingTemplateFields);
}

function applicationFillMergeProfile(storedProfile) {
  const merged = structuredClone(APPLICATION_FILL_DEFAULT_PROFILE);
  if (!storedProfile) return merged;
  const storedVersion = Number(storedProfile.profileVersion || 0);
  const preserveRecordOrder = storedVersion >= APPLICATION_FILL_PROFILE_VERSION;
  const needsTemplateUpgrade = storedVersion < APPLICATION_FILL_PROFILE_VERSION;

  for (const locale of ["zh", "en"]) {
    const storedLocale = storedProfile[locale];
    if (!storedLocale) continue;
    const defaults = APPLICATION_FILL_DEFAULT_PROFILE[locale];
    const hasSavedOrder = Array.isArray(storedLocale.sectionOrder);
    const aliases = applicationFillSectionAliases(locale);
    const savedGroups = structuredClone(storedLocale.groups || {});
    const savedRepeatableGroups = structuredClone(storedLocale.repeatableGroups || {});
    for (const [from, to] of Object.entries(aliases)) {
      if (!savedGroups[to] && savedGroups[from]) savedGroups[to] = savedGroups[from];
      if (!savedRepeatableGroups[to] && savedRepeatableGroups[from]) savedRepeatableGroups[to] = savedRepeatableGroups[from];
      delete savedGroups[from];
      delete savedRepeatableGroups[from];
    }
    const savedOrder = (storedLocale.sectionOrder || []).map((item) => aliases[item] || item);
    merged[locale].groups = savedGroups;
    merged[locale].workTitle = storedLocale.workTitle || defaults.workTitle;
    merged[locale].internshipTitle = storedLocale.internshipTitle || defaults.internshipTitle;

    if (!hasSavedOrder) {
      for (const [group, fields] of Object.entries(defaults.groups)) {
        const existing = merged[locale].groups[group];
        if (!existing) { merged[locale].groups[group] = structuredClone(fields); continue; }
        const labels = new Set(existing.map(([label]) => label));
        for (const field of fields) if (!labels.has(field[0])) existing.push(structuredClone(field));
      }
    }

    merged[locale].repeatableGroups = {};
    for (const [title, records] of Object.entries(defaults.repeatableGroups)) {
      const savedRecords = savedRepeatableGroups[title] ?? merged[locale].groups[title];
      const introducedInThisVersion = storedVersion < APPLICATION_FILL_PROFILE_VERSION && [locale === "zh" ? "证书" : "Certificates", locale === "zh" ? "奖励信息" : "Awards"].includes(title);
      const wasKept = !hasSavedOrder || savedOrder.includes(title) || savedRecords || introducedInThisVersion;
      if (wasKept) merged[locale].repeatableGroups[title] = title === (locale === "zh" ? "语言能力" : "Languages") ? applicationFillUpgradeLanguageRecords(savedRecords, records[0], locale, preserveRecordOrder, needsTemplateUpgrade) : applicationFillUpgradeRecords(applicationFillRecords(savedRecords, records), records[0], applicationFillDateAliases(locale, title), preserveRecordOrder, needsTemplateUpgrade);
      delete merged[locale].groups[title];
    }
    for (const [title, records] of Object.entries(savedRepeatableGroups)) {
      if (defaults.repeatableGroups[title]) continue;
      merged[locale].repeatableGroups[title] = applicationFillRecords(records, []);
    }
    merged[locale].variantGroups = structuredClone(storedLocale.variantGroups || {});

    const legacyWork = merged[locale].groups[defaults.workTitle] || merged[locale].groups[merged[locale].workTitle];
    const workWasKept = !hasSavedOrder || storedLocale.sectionOrder.includes(APPLICATION_FILL_WORK_KEY) || storedLocale.sectionOrder.includes(defaults.workTitle) || storedLocale.workVariants || legacyWork;
    const workTemplate = Object.values(defaults.workVariants)[0][0];
    merged[locale].workVariants = workWasKept ? Object.fromEntries(Object.entries(applicationFillVariants(storedLocale.workVariants, legacyWork ? { [Object.keys(defaults.workVariants)[0]]: legacyWork } : defaults.workVariants)).map(([name, records]) => [name, applicationFillUpgradeRecords(records, workTemplate, applicationFillDateAliases(locale, defaults.workTitle), preserveRecordOrder, needsTemplateUpgrade)])) : {};
    delete merged[locale].groups[defaults.workTitle];
    delete merged[locale].groups[merged[locale].workTitle];
    const internshipWasKept = !hasSavedOrder || storedLocale.sectionOrder.includes(APPLICATION_FILL_INTERNSHIP_KEY) || storedLocale.internshipVariants;
    const internshipTemplate = Object.values(defaults.internshipVariants)[0][0];
    merged[locale].internshipVariants = internshipWasKept ? Object.fromEntries(Object.entries(applicationFillVariants(storedLocale.internshipVariants, defaults.internshipVariants)).map(([name, records]) => [name, applicationFillUpgradeRecords(records, internshipTemplate, applicationFillDateAliases(locale, defaults.internshipTitle), preserveRecordOrder, needsTemplateUpgrade)])) : {};

    const available = new Set([...Object.keys(merged[locale].groups), ...Object.keys(merged[locale].repeatableGroups), ...Object.keys(merged[locale].variantGroups)]);
    if (Object.keys(merged[locale].workVariants).length) available.add(APPLICATION_FILL_WORK_KEY);
    if (Object.keys(merged[locale].internshipVariants).length) available.add(APPLICATION_FILL_INTERNSHIP_KEY);
    const requestedOrder = (hasSavedOrder ? savedOrder : defaults.sectionOrder).map((item) => item === defaults.workTitle ? APPLICATION_FILL_WORK_KEY : item);
    if (storedVersion < APPLICATION_FILL_PROFILE_VERSION) {
      for (const section of defaults.sectionOrder) {
        if (!available.has(section) || requestedOrder.includes(section)) continue;
        const next = defaults.sectionOrder.slice(defaults.sectionOrder.indexOf(section) + 1).find((item) => requestedOrder.includes(item));
        requestedOrder.splice(next ? requestedOrder.indexOf(next) : requestedOrder.length, 0, section);
      }
    }
    merged[locale].sectionOrder = requestedOrder.filter((item, index) => available.has(item) && requestedOrder.indexOf(item) === index);
    for (const group of [...Object.keys(merged[locale].groups), ...Object.keys(merged[locale].repeatableGroups), ...Object.keys(merged[locale].variantGroups)]) if (!merged[locale].sectionOrder.includes(group)) merged[locale].sectionOrder.push(group);
    for (const key of [APPLICATION_FILL_WORK_KEY, APPLICATION_FILL_INTERNSHIP_KEY]) if (available.has(key) && !merged[locale].sectionOrder.includes(key)) merged[locale].sectionOrder.push(key);

    const personalGroup = locale === "zh" ? "基础资料" : "Personal";
    const personalEntries = merged[locale].groups[personalGroup];
    if (!personalEntries) continue;
    const phoneLabels = locale === "zh" ? ["手机号", "中国大陆手机号", "香港手机号"] : ["Phone", "Mainland China phone", "Hong Kong phone"];
    const addressLabels = locale === "zh" ? ["中文地址", "英文地址"] : ["English address", "Address"];
    const phone = personalEntries.find(([label]) => phoneLabels.includes(label));
    const address = personalEntries.find(([label]) => addressLabels.includes(label));
    if (phone) phone[0] = locale === "zh" ? "手机号" : "Phone";
    if (address) address[0] = locale === "zh" ? "中文地址" : "English address";
    merged[locale].groups[personalGroup] = personalEntries.filter(([label], index) => !(phoneLabels.includes(label) && personalEntries[index] !== phone) && !(addressLabels.includes(label) && personalEntries[index] !== address));
  }
  return merged;
}

async function applicationFillProfile() {
  const stored = await applicationFillApi.storage.local.get("applicationFillProfile");
  return applicationFillMergeProfile(stored.applicationFillProfile);
}
