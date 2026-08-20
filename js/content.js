const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export const PROFILE = freeze({
  name: "郑林茂",
  role: "AI 产品经理",
  education: "汕头大学金融学硕士在读",
  company: "爱回收·万物新生集团 / AI 产品实习生",
  email: "1012782105@qq.com",
  hero: "把重复判断，压缩成一次决策。",
});

const item = (value) => freeze(value);

export const PORTFOLIO_ITEMS = freeze([
  item({
    id: "baidu-industry-solutions",
    label: "行业研究工作流",
    kind: "case",
    mapVisible: true,
    region: "face",
    caseOrder: 1,
    companyContext: "百度智能云",
    projectContext: null,
    storyKicker: "RESEARCH",
    summary: "聚焦养老、宠物、AI 产品、智能穿戴、康复医疗等新零售方向，独立沉淀 15 份专题研究与竞品分析报告、5 份通用行业解决方案及销售材料，并将研究方法沉淀为可复用 Skill，形成“信号发现→方向筛选→专题研究→方案包装→销售验证”的 AI 工作流，实现团队效率提升 20%。",
    steps: ["扫描养老、宠物、AI 产品、智能穿戴与康复医疗等新零售信号", "围绕市场信号、产业链、竞品格局与客户分层形成结构化判断", "将千帆、伐谋、百舸、一见、GEO、DuMate、慧播星映射至具体场景", "用可复用 Skill 和销售验证闭环输出方案与客户线索"],
    metrics: [
      { value: "15 份", label: "研究与竞品报告", kind: "result" },
      { value: "5 份", label: "通用方案与销售材料", kind: "result" },
      { value: "20%", label: "团队效率提升", kind: "result" },
    ],
    solutionCard: {
      kicker: "3D PRINTING / SOLUTION SNAPSHOT",
      audience: "设备与材料厂商、打印农场 / 工作室",
      problem: "算法、材料研发与排产工具彼此割裂，客户需要先验证价值，再决定部署深度。",
      approach: "用行业需求拆解切片与路径优化、端侧质检和轻量排产，形成可试用、可落地的 AI 方案路径。",
    },
    solutionCards: [
      {
        kicker: "SPORTS & HEALTH / SOLUTION SNAPSHOT",
        audience: "智能硬件与穿戴设备厂商、运动品牌、场馆与运动内容平台",
        problem: "硬件设备、算法、内容和平台各自建设，容易出现点状 AI、断点售后与重复建设。",
        approach: "以异构算力、千帆大模型和数据标注为统一底座，按“智能硬件与穿戴设备 / 软件平台与内容服务（AIGC）”两条路径按需组合，覆盖姿态识别、端侧轻量模型、内容生成与企业助手。",
      },
    ],
    evidence: ["ai-coding-control-center.png", "sports-health-solution.png"],
    anchor: [0, 1.2, 0.58],
  }),
  item({
    id: "industry-research",
    label: "行业研究 Skill",
    kind: "skill",
    mapVisible: false,
    caseOrder: null,
    companyContext: "百度智能云",
    projectContext: null,
    storyKicker: null,
    summary: "把信息检索、来源核验、行业拆解、客户分析和报告输出沉淀为可复用 Skill，让研究结论能直接进入方案包装与销售验证。",
    steps: ["定义研究对象、客户角色与验证问题", "核验官方来源并整理市场与产业链信号", "拆解竞品格局、客户分层与进入路径", "输出研究报告、客户画像、销售谈参与方案材料"],
    metrics: [{ value: "15 份", label: "研究与竞品报告", kind: "result" }, { value: "20%", label: "团队效率提升", kind: "result" }],
    evidence: [],
    anchor: [-0.5, 1.72, 0.58],
  }),
  item({
    id: "retail-radar",
    label: "零售热点雷达",
    kind: "skill",
    mapVisible: false,
    caseOrder: null,
    companyContext: "百度智能云",
    projectContext: null,
    storyKicker: null,
    summary: "把养老、宠物、智能穿戴与康复医疗等新零售方向的市场信号，整理成可进入专题研究、客户分析和方案验证的方向池。",
    steps: ["采集新零售与 AI 产品市场信号", "核验来源、产业链位置与竞品动态", "按客户价值、验证难度与进入路径筛选", "输出方向判断并进入专题研究与销售验证"],
    metrics: [{ value: "5 类", label: "重点研究方向", kind: "result" }, { value: "20%", label: "团队效率提升", kind: "result" }],
    evidence: [],
    anchor: [0.78, 0.72, 0.62],
  }),
  item({
    id: "refund-automation",
    label: "一键转卖自动化退费助手",
    kind: "case",
    mapVisible: false,
    caseOrder: 3,
    companyContext: "业务自动化项目",
    projectContext: "京东拍拍二手业务协同项目",
    storyKicker: "BUSINESS PROJECT",
    summary: "针对京东拍拍退服务费流程跨 5 个系统、单均耗时 3 分钟的问题，梳理 SOP 与 PRD，搭建从订单查询、物流节点识别到退费决策的 Agent 工作流；上线后 90% 订单自动处理、10% 转人工兜底，单均时效降至 2 秒，月均节省 60 小时和 4300 元成本。",
    steps: ["梳理跨 5 个系统的业务 SOP、输入输出参数与判定办法", "用 Coze + Gemini 完成工作流 MVP 验证并对接研发", "用 Joyagent 识别物流拒收节点并插件化上线", "以 90% 自动处理和 10% 人工兜底验证效果，沉淀 SOP 教学案例"],
    metrics: [
      { value: "3 分钟→2 秒", label: "单均处理时效", kind: "result" },
      { value: "90%", label: "全自动处理率", kind: "result" },
      { value: "90%", label: "物流拒收召回率", kind: "result" },
      { value: "100%", label: "物流拒收识别精确率", kind: "result" },
      { value: "60 小时", label: "月均节省工时", kind: "result" },
      { value: "4300 元", label: "月均节省成本", kind: "result" },
    ],
    evidence: [
      "refund-result-01.jpg",
      "refund-result-02.jpg",
      "refund-result-03.jpg",
      "refund-result-04.jpg",
      "teaching-case-01.png",
      "teaching-case-02.jpg",
    ],
    anchor: [-1.02, -0.2, 0.28],
  }),
  item({
    id: "ai-audit",
    label: "AI 商品稽查项目",
    kind: "case",
    mapVisible: false,
    caseOrder: 2,
    companyContext: "爱回收·万物新生集团",
    projectContext: null,
    storyKicker: "MULTIMODAL",
    summary: "作为项目 owner，主导 20 万张手机商品图的 AI 商品稽查流程从 0 到 1：用 CV 检测、Python/API 取图和 Dify 编排建立检测链路，再通过 Routing、Case 库、Evaluator 与 bad case RAG 持续优化识别效果；LLM 识别准确率 90%，问题商品识别成功率 100%，项目成本约 3000 元，测算 ROI 1:40。",
    steps: ["用 CV 检测与 Python/API 取图搭建 Dify 商品稽查链路", "多轮评测识别精度、响应速度与 Token 消耗，筛选性价比模型", "联动客服沉淀品牌 Routing、Case 库和 bad case RAG，建立 Evaluator 闭环", "以 LLM 识别准确率 90% 和问题商品识别成功率 100% 验证交付"],
    metrics: [
      { value: "20 万张", label: "手机商品图", kind: "result" },
      { value: "90%", label: "LLM 识别准确率", kind: "result" },
      { value: "100%", label: "问题商品识别成功率", kind: "result" },
      { value: "约 3000 元", label: "项目总成本", kind: "result" },
      { value: "1:40", label: "测算 ROI", kind: "result" },
    ],
    evidence: ["ai-audit-workflow.png"],
    anchor: [0.68, -0.25, 0.76],
  }),
  item({
    id: "working-method",
    label: "工作方法",
    kind: "method",
    mapVisible: false,
    caseOrder: null,
    companyContext: null,
    projectContext: null,
    storyKicker: null,
    summary: "先进入业务现场，再压缩问题；先定义边界，再选择工具；最后用结果和复盘判断是否扩展。",
    steps: ["问题定义：行业研究", "节点拆解：热点雷达", "工具匹配：退费自动化", "结果复盘：AI 商品稽查"],
    metrics: [{ value: "4 步", label: "可迁移方法", kind: "result" }],
    evidence: [],
    anchor: [0, -1.35, 0.72],
  }),
  item({
    id: "recommerce-ai-solutions",
    label: "AI 产品与业务自动化",
    kind: "case",
    mapVisible: true,
    region: "body",
    caseOrder: null,
    companyContext: "爱回收·万物新生集团",
    projectContext: "含京东拍拍业务协同与 AI 商品稽查项目",
    storyKicker: "PRODUCT SYSTEM",
    summary: "把真实业务问题拆成可执行的 AI 产品与自动化流程，覆盖 20 万张商品图稽查、跨 5 个系统退费判断、物流拒收识别与模型评测，强调从 0→1 验证、人工兜底和效果复盘。",
    steps: ["梳理业务规则、输入输出与异常边界", "拆分模型判断、API 调用和系统执行节点", "设计 Evaluator、bad case RAG 与人工兜底反馈", "用准确率、召回率、处理时效和成本验证方案"],
    metrics: [
      { value: "3 分钟→2 秒", label: "单均处理时效", kind: "result" },
      { value: "90%", label: "全自动处理率", kind: "result" },
      { value: "90%", label: "物流拒收召回率", kind: "result" },
      { value: "60 小时", label: "月均节省工时", kind: "result" },
      { value: "4300 元", label: "月均节省成本", kind: "result" },
    ],
    evidence: ["refund-result-01.jpg", "ai-audit-workflow.png"],
    anchor: [0, 0.08, 0.62],
  }),
]);

export const CAPABILITY_ITEMS = freeze(PORTFOLIO_ITEMS.filter((item) => item.mapVisible));

export const CASE_ITEMS = freeze(
  PORTFOLIO_ITEMS
    .filter((item) => Number.isInteger(item.caseOrder))
    .sort((left, right) => left.caseOrder - right.caseOrder),
);

export const EXPERIENCE_TIMELINE = freeze([
  {
    id: "baidu",
    period: "2026.06–至今",
    employer: "百度智能云",
    role: "AI 解决方案实习生",
    highlights: "15 份研究与竞品报告 · 5 份方案材料 · 团队效率提升 20%",
  },
  {
    id: "recommerce",
    period: "2026.01–2026.05",
    employer: "爱回收·万物新生集团",
    role: "AI 商品稽查项目",
    highlights: "20 万张商品图 · 90% 订单自动处理 · 60 小时/月节省",
    project: {
      company: "京东拍拍二手",
      title: "一键转卖自动化退费助手",
      result: "跨 5 个系统 · 3 分钟→2 秒 · 90% 自动处理 · 4300 元/月节省",
    },
  },
]);
