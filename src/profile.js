const APPLICATION_FILL_WORK_KEY = "__application_fill_work__";
const APPLICATION_FILL_INTERNSHIP_KEY = "__application_fill_internship__";

const APPLICATION_FILL_DEFAULT_PROFILE = {
  zh: {
    sectionOrder: ["基础资料", "教育经历", APPLICATION_FILL_WORK_KEY, APPLICATION_FILL_INTERNSHIP_KEY, "项目经历", "校园经历", "技能", "语言能力", "兴趣爱好", "个人评价", "链接与常用问答"],
    workTitle: "工作经历",
    internshipTitle: "实习经历",
    groups: {
      "基础资料": [["中文姓名", ""], ["中文姓", ""], ["中文名", ""], ["英文姓名", ""], ["英文名（Given name）", ""], ["英文姓（Family name）", ""], ["Preferred name", ""], ["性别", ""], ["出生日期", ""], ["国籍/地区", ""], ["中国大陆身份证", ""], ["香港身份证", ""], ["护照号码", ""], ["电子邮箱", ""], ["手机号", ""], ["微信号", ""], ["中文地址", ""], ["邮政编码", ""]],
      "技能": [["技能", ""], ["编程语言", "Python"], ["工具 / 软件", ""], ["证书", ""]],
      "语言能力": [["中文", "母语"], ["英文", ""]],
      "兴趣爱好": [["兴趣爱好", ""]],
      "个人评价": [["个人评价", ""]],
      "链接与常用问答": [["LinkedIn", ""], ["GitHub", ""], ["作品集", ""], ["期望薪资", ""], ["到岗时间", ""]]
    },
    repeatableGroups: {
      "教育经历": [[["学校", ""], ["学院/系", ""], ["专业", ""], ["学位", ""], ["GPA", ""], ["毕业时间", ""]]],
      "项目经历": [[["项目名称", ""], ["项目角色", ""], ["项目日期", ""], ["项目描述", ""]]],
      "校园经历": [[["组织/社团", ""], ["职务", ""], ["日期", ""], ["经历描述", ""]]]
    },
    variantGroups: {},
    workVariants: { "可替换不同版本": [[["公司", ""], ["职位", ""], ["日期", ""], ["工作描述", ""]]] },
    internshipVariants: { "可替换不同版本": [[["公司", ""], ["岗位", ""], ["日期", ""], ["实习描述", ""]]] }
  },
  en: {
    sectionOrder: ["Personal", "Education", APPLICATION_FILL_WORK_KEY, APPLICATION_FILL_INTERNSHIP_KEY, "Projects", "Campus activities", "Skills", "Languages", "Interests", "Personal statement", "Links & common answers"],
    workTitle: "Work experience",
    internshipTitle: "Internship experience",
    groups: {
      "Personal": [["First / given name", ""], ["Last / family name", ""], ["Preferred name", ""], ["Full legal name", ""], ["Chinese name", ""], ["Gender", ""], ["Date of birth", ""], ["Nationality / region", ""], ["Mainland China ID", ""], ["Hong Kong ID", ""], ["Passport number", ""], ["Email", ""], ["Phone", ""], ["WeChat", ""], ["English address", ""], ["Postal code", ""]],
      "Skills": [["Skills", ""], ["Programming languages", "Python"], ["Tools / software", ""], ["Certificates", ""]],
      "Languages": [["Chinese", "Native"], ["English", ""]],
      "Interests": [["Interests", ""]],
      "Personal statement": [["Personal statement", ""]],
      "Links & common answers": [["LinkedIn", ""], ["GitHub", ""], ["Portfolio", ""], ["Expected salary", ""], ["Availability", ""]]
    },
    repeatableGroups: {
      "Education": [[["School", ""], ["Faculty / department", ""], ["Major", ""], ["Degree", ""], ["GPA", ""], ["Graduation date", ""]]],
      "Projects": [[["Project name", ""], ["Role", ""], ["Dates", ""], ["Description", ""]]],
      "Campus activities": [[["Organisation", ""], ["Role", ""], ["Dates", ""], ["Description", ""]]]
    },
    variantGroups: {},
    workVariants: { "Replaceable version": [[["Company", ""], ["Title", ""], ["Dates", ""], ["Description", ""]]] },
    internshipVariants: { "Replaceable version": [[["Company", ""], ["Title", ""], ["Dates", ""], ["Description", ""]]] }
  }
};

const applicationFillApi = globalThis.browser ?? globalThis.chrome;

function applicationFillRecords(value, fallback) {
  if (!Array.isArray(value)) return structuredClone(fallback);
  if (Array.isArray(value[0]?.[0])) return structuredClone(value);
  return [structuredClone(value)];
}

function applicationFillVariants(value, fallback) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
  return Object.fromEntries(Object.entries(source).map(([name, records]) => [name, applicationFillRecords(records, [])]));
}

function applicationFillMergeProfile(storedProfile) {
  const merged = structuredClone(APPLICATION_FILL_DEFAULT_PROFILE);
  if (!storedProfile) return merged;

  for (const locale of ["zh", "en"]) {
    const storedLocale = storedProfile[locale];
    if (!storedLocale) continue;
    const defaults = APPLICATION_FILL_DEFAULT_PROFILE[locale];
    const hasSavedOrder = Array.isArray(storedLocale.sectionOrder);
    merged[locale].groups = structuredClone(storedLocale.groups || {});
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
      const savedRecords = storedLocale.repeatableGroups?.[title] ?? merged[locale].groups[title];
      const wasKept = !hasSavedOrder || storedLocale.sectionOrder.includes(title) || savedRecords;
      if (wasKept) merged[locale].repeatableGroups[title] = applicationFillRecords(savedRecords, records);
      delete merged[locale].groups[title];
    }
    merged[locale].variantGroups = structuredClone(storedLocale.variantGroups || {});

    const legacyWork = merged[locale].groups[defaults.workTitle] || merged[locale].groups[merged[locale].workTitle];
    const workWasKept = !hasSavedOrder || storedLocale.sectionOrder.includes(APPLICATION_FILL_WORK_KEY) || storedLocale.sectionOrder.includes(defaults.workTitle) || storedLocale.workVariants || legacyWork;
    merged[locale].workVariants = workWasKept ? applicationFillVariants(storedLocale.workVariants, legacyWork ? { [Object.keys(defaults.workVariants)[0]]: legacyWork } : defaults.workVariants) : {};
    delete merged[locale].groups[defaults.workTitle];
    delete merged[locale].groups[merged[locale].workTitle];
    const internshipWasKept = !hasSavedOrder || storedLocale.sectionOrder.includes(APPLICATION_FILL_INTERNSHIP_KEY) || storedLocale.internshipVariants;
    merged[locale].internshipVariants = internshipWasKept ? applicationFillVariants(storedLocale.internshipVariants, defaults.internshipVariants) : {};

    const available = new Set([...Object.keys(merged[locale].groups), ...Object.keys(merged[locale].repeatableGroups), ...Object.keys(merged[locale].variantGroups)]);
    if (Object.keys(merged[locale].workVariants).length) available.add(APPLICATION_FILL_WORK_KEY);
    if (Object.keys(merged[locale].internshipVariants).length) available.add(APPLICATION_FILL_INTERNSHIP_KEY);
    const requestedOrder = (hasSavedOrder ? storedLocale.sectionOrder : defaults.sectionOrder).map((item) => item === defaults.workTitle ? APPLICATION_FILL_WORK_KEY : item);
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
