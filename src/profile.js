const APPLICATION_FILL_DEFAULT_PROFILE = {
  zh: {
    groups: {
      "基础资料": [
        ["中文姓名", ""], ["中文姓", ""], ["中文名", ""], ["英文姓名", ""], ["英文名（Given name）", ""], ["英文姓（Family name）", ""], ["Preferred name", ""], ["性别", ""], ["出生日期", ""], ["国籍/地区", ""],
        ["中国大陆身份证", ""], ["香港身份证", ""], ["护照号码", ""], ["电子邮箱", ""], ["中国大陆手机号", ""],
        ["香港手机号", ""], ["微信号", ""], ["中文地址", ""], ["英文地址", ""], ["邮政编码", ""]
      ],
      "教育经历": [["学校", ""], ["学院/系", ""], ["专业", ""], ["学位", ""], ["GPA", ""], ["毕业时间", ""]],
      "工作经历": [["公司", ""], ["职位", ""], ["日期", ""], ["工作描述", ""]],
      "项目经历": [["项目名称", ""], ["项目角色", ""], ["项目日期", ""], ["项目描述", ""]],
      "校园经历": [["组织/社团", ""], ["职务", ""], ["日期", ""], ["经历描述", ""]],
      "语言能力": [["中文", "母语"], ["英文", ""]],
      "兴趣爱好": [["兴趣爱好", ""]],
      "个人评价": [["个人评价", ""]],
      "链接与常用问答": [["LinkedIn", ""], ["GitHub", ""], ["作品集", ""], ["期望薪资", ""], ["到岗时间", ""]]
    },
    internshipVariants: {
      "可替换不同版本": [["公司", ""], ["岗位", ""], ["日期", ""], ["实习描述", ""]]
    }
  },
  en: {
    groups: {
      "Personal": [
        ["First / given name", ""], ["Last / family name", ""], ["Preferred name", ""], ["Full legal name", ""], ["Chinese name", ""], ["Gender", ""], ["Date of birth", ""], ["Nationality / region", ""],
        ["Mainland China ID", ""], ["Hong Kong ID", ""], ["Passport number", ""], ["Email", ""], ["Mainland China phone", ""],
        ["Hong Kong phone", ""], ["WeChat", ""], ["Address", ""], ["Postal code", ""]
      ],
      "Education": [["School", ""], ["Faculty / department", ""], ["Major", ""], ["Degree", ""], ["GPA", ""], ["Graduation date", ""]],
      "Work experience": [["Company", ""], ["Title", ""], ["Dates", ""], ["Description", ""]],
      "Projects": [["Project name", ""], ["Role", ""], ["Dates", ""], ["Description", ""]],
      "Campus activities": [["Organisation", ""], ["Role", ""], ["Dates", ""], ["Description", ""]],
      "Languages": [["Chinese", "Native"], ["English", ""]],
      "Interests": [["Interests", ""]],
      "Personal statement": [["Personal statement", ""]],
      "Links & common answers": [["LinkedIn", ""], ["GitHub", ""], ["Portfolio", ""], ["Expected salary", ""], ["Availability", ""]]
    },
    internshipVariants: {
      "Replaceable version": [["Company", ""], ["Title", ""], ["Dates", ""], ["Description", ""]]
    }
  }
};

const applicationFillApi = globalThis.browser ?? globalThis.chrome;

function applicationFillMergeProfile(storedProfile) {
  const merged = structuredClone(APPLICATION_FILL_DEFAULT_PROFILE);
  if (!storedProfile) return merged;

  for (const locale of ["zh", "en"]) {
    const storedLocale = storedProfile[locale];
    if (!storedLocale) continue;
    merged[locale].groups = structuredClone(storedLocale.groups || {});
    merged[locale].internshipVariants = structuredClone(storedLocale.internshipVariants || {});

    for (const [group, defaults] of Object.entries(APPLICATION_FILL_DEFAULT_PROFILE[locale].groups)) {
      const existing = merged[locale].groups[group];
      if (!existing) { merged[locale].groups[group] = structuredClone(defaults); continue; }
      const labels = new Set(existing.map(([label]) => label));
      for (const entry of defaults) if (!labels.has(entry[0])) existing.push(structuredClone(entry));
    }
    for (const [variant, defaults] of Object.entries(APPLICATION_FILL_DEFAULT_PROFILE[locale].internshipVariants)) {
      const existing = merged[locale].internshipVariants[variant];
      if (!existing) { merged[locale].internshipVariants[variant] = structuredClone(defaults); continue; }
      const labels = new Set(existing.map(([label]) => label));
      for (const entry of defaults) if (!labels.has(entry[0])) existing.push(structuredClone(entry));
    }
  }
  return merged;
}

async function applicationFillProfile() {
  const stored = await applicationFillApi.storage.local.get("applicationFillProfile");
  return applicationFillMergeProfile(stored.applicationFillProfile);
}
