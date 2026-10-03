import { CurriculumAnalysisResult } from '../types/themes';

export const INITIAL_CURRICULUM_DATA: CurriculumAnalysisResult = {
  title: 'أنظمة التحكم الحديثة وفضاء الحالة (Modern Control Systems)',
  discipline: 'Engineering (الهندسة الكهربية والميكانيكية)',
  targetLanguage: 'ar-EG',
  level: 'Undergraduate / Professional (بكالوريوس هندسة وماجستير)',
  executiveSummary:
    'بص يا هندسة، المنهج ده بيمثل النقلة النوعية من كلاسيك كنترول (دوال التحويل ومخطط بود) لأنظمة التحكم الحديثة المبنية على تمثيل فضاء الحالة (State-Space). الميزة الجوهرية هنا إننا بنتعامل مع أنظمة متعددة المداخل والمخارج (MIMO) مش بس مدخل ومخرج واحد، وبنقدر نحدد بدقة استقرار النظام وإمكانية التحكم فيه ومراقبته، وتصميم مغذي الحالة الراجعة (State Feedback) لضبط أقطاب النظام عند أي نقطة مرغوبة.',
  masterFormulaLedger: [
    {
      id: 'EQ-1',
      name: 'معادلة الحالة الديناميكية الخطية (State Differential Equation)',
      latex: '\\dot{\\mathbf{x}}(t) = \\mathbf{A}\\mathbf{x}(t) + \\mathbf{B}\\mathbf{u}(t)',
      variables: [
        { symbol: '\\mathbf{x}(t)', meaning: 'متجه متغيرات الحالة (State Vector)', unit: 'n \\times 1' },
        { symbol: '\\mathbf{A}', meaning: 'مصفوفة النظام الديناميكية (System Matrix)', unit: 'n \\times n' },
        { symbol: '\\mathbf{B}', meaning: 'مصفوفة المدخلات أو التحكم (Input Matrix)', unit: 'n \\times m' },
        { symbol: '\\mathbf{u}(t)', meaning: 'متجه إشارات التحكم الخارجية', unit: 'm \\times 1' },
      ],
      context: 'تصف تطور وتغير حالات النظام مع الزمن لأي نظام خطي غير متغير مع الزمن (LTI).',
    },
    {
      id: 'EQ-2',
      name: 'معادلة الخرج والقياس (Output Algebraic Equation)',
      latex: '\\mathbf{y}(t) = \\mathbf{C}\\mathbf{x}(t) + \\mathbf{D}\\mathbf{u}(t)',
      variables: [
        { symbol: '\\mathbf{y}(t)', meaning: 'متجه إشارات الخرج المقاسة', unit: 'p \\times 1' },
        { symbol: '\\mathbf{C}', meaning: 'مصفوفة الخرج (Output Matrix)', unit: 'p \\times n' },
        { symbol: '\\mathbf{D}', meaning: 'مصفوفة التغذية المباشرة (Feedthrough)', unit: 'p \\times m' },
      ],
      context: 'تربط الحالات الداخلية بالمتغيرات التي يمكن قياسها فعلياً بالحساسات.',
    },
    {
      id: 'EQ-3',
      name: 'مصفوفة انتقال الحالة (State Transition Matrix)',
      latex: '\\mathbf{\\Phi}(t) = e^{\\mathbf{A}t} = \\mathcal{L}^{-1}\\left\\{(s\\mathbf{I} - \\mathbf{A})^{-1}\\right\\}',
      variables: [
        { symbol: 'e^{\\mathbf{A}t}', meaning: 'أس المصفوفة الأسية (Matrix Exponential)', unit: 'بلا أبعاد' },
        { symbol: '\\mathbf{I}', meaning: 'مصفوفة الوحدة (Identity Matrix)', unit: 'n \\times n' },
        { symbol: 's', meaning: 'متغير لابلاس الترددي المركب (Complex Frequency)', unit: 'rad/s' },
      ],
      context: 'تستخدم لحساب الاستجابة الزمنية الحرة للنظام عند وجود شروط ابتدائية بدون مدخلات خارجية.',
    },
    {
      id: 'EQ-4',
      name: 'دالة التحويل المستنتجة من فضاء الحالة (Transfer Function Matrix)',
      latex: '\\mathbf{G}(s) = \\mathbf{C}(s\\mathbf{I} - \\mathbf{A})^{-1}\\mathbf{B} + \\mathbf{D}',
      variables: [
        { symbol: '\\mathbf{G}(s)', meaning: 'مصفوفة دوال التحويل بين المداخل والمخارج', unit: 'p \\times m' },
        { symbol: '(s\\mathbf{I} - \\mathbf{A})^{-1}', meaning: 'مقلوب مصفوفة المميز (Resolvent Matrix)', unit: 'n \\times n' },
      ],
      context: 'الجسر الرياضي الذي يربط بين التمثيل الحسابي الحديث والتمثيل الكلاسيكي في مجال التردد.',
    },
    {
      id: 'EQ-5',
      name: 'مصفوفة كالبان لإمكانية التحكم (Kalman Controllability Matrix)',
      latex: '\\mathcal{C} = \\begin{bmatrix} \\mathbf{B} & \\mathbf{AB} & \\mathbf{A}^2\\mathbf{B} & \\dots & \\mathbf{A}^{n-1}\\mathbf{B} \\end{bmatrix}',
      variables: [
        { symbol: '\\mathcal{C}', meaning: 'مصفوفة إمكانية التحكم الكلية', unit: 'n \\times (n \\cdot m)' },
        { symbol: 'n', meaning: 'رتبة النظام (عدد متغيرات الحالة المستقلة)', unit: 'عدد صحيح' },
      ],
      context: 'يكون النظام قابلاً للتحكم بالكامل (Controllable) إذا وفقط إذا كانت رتبة المصفوفة تساوي n بالكامل.',
    },
    {
      id: 'EQ-6',
      name: 'مصفوفة كالبان لإمكانية المراقبة (Kalman Observability Matrix)',
      latex: '\\mathcal{O} = \\begin{bmatrix} \\mathbf{C} \\\\ \\mathbf{CA} \\\\ \\mathbf{CA}^2 \\\\ \\vdots \\\\ \\mathbf{CA}^{n-1} \\end{bmatrix}',
      variables: [
        { symbol: '\\mathcal{O}', meaning: 'مصفوفة إمكانية الرصد والمراقبة', unit: '(n \\cdot p) \\times n' },
      ],
      context: 'تحدد هل يمكن إعادة بناء كافة الحالات الداخلية غير المقاسة اعتماداً فقط على قياسات الخرج المتاحة.',
    },
    {
      id: 'EQ-7',
      name: 'صيغة أكرمان لتحديد كسب التغذية الراجعة (Ackermann\'s Formula)',
      latex: '\\mathbf{K} = \\begin{bmatrix} 0 & 0 & \\dots & 1 \\end{bmatrix} \\mathcal{C}^{-1} \\alpha_c(\\mathbf{A})',
      variables: [
        { symbol: '\\mathbf{K}', meaning: 'متجه كسب التغذية الراجعة (State Feedback Gain)', unit: '1 \\times n' },
        { symbol: '\\alpha_c(\\mathbf{A})', meaning: 'كثير الحدود المميز المرغوب محسوباً عند المصفوفة A', unit: 'n \\times n' },
      ],
      context: 'تسمح بنقل جميع أقطاب النظام المغلق إلى أماكن جديدة في نصف المستوى الأيسر لتحقيق سرعة واستقرار فائقين.',
    },
  ],
  coreTheoremsAndLaws: [
    {
      name: 'مبرهنة كالبان لإمكانية التحكم الكامل (Kalman Controllability Theorem)',
      statement: 'يمكن نقل النظام الخطي من أي حالة ابتدائية x(0) إلى أي حالة نهائية مرغوبة x(t_f) في زمن منتهٍ إذا وفقط إذا كانت رتبة المصفوفة تامة: rank(C) = n.',
      formulaRefId: 'EQ-5',
      intuitiveExplanation: 'بالمصري كده: لو الرتبة مش كاملة، ده معناه إن في جزء أو متغير حالة في السيستم معزول تماماً عن إشارة الماتور أو الجهد الداخل ومش هتعرف تأثر عليه مهما زودت الباور!',
    },
    {
      name: 'مبرهنة كالبان للرصد والمراقبة (Kalman Observability Theorem)',
      statement: 'تكون الحالات الداخلية قابلة للتعيين الكامل من قياسات الخرج y(t) خلال فترة زمنية محددة إذا وفقط إذا كانت رتبة مصفوفة المراقبة تامة: rank(O) = n.',
      formulaRefId: 'EQ-6',
      intuitiveExplanation: 'الفكرة إن الحساسات ممكن تكون متوصلة في نقط معينة في الدائرة، لو المبرهنة اتحققت، نقدر نصمم مراقب حالة (State Observer / Luenberger) يقدر يحسب الحالات المخفية بدقة خرافية من غير ما نشتري حساسات غالية زيادة.',
    },
    {
      name: 'استقرار ليابونوف للأنظمة الخطية (Lyapunov LTI Stability Theorem)',
      statement: 'يكون النظام مستقراً استقراراً تقاربياً (Asymptotically Stable) إذا وفقط إذا وجد حل فريد ومتماثل وموجب تماماً للمصفوفة P في معادلة ليابونوف: A^T P + P A = -Q لأي مصفوفة Q متماثلة وموجبة قطباً.',
      intuitiveExplanation: 'ليابونوف بيقيس طاقة النظام الافتراضية؛ لو مشتقة دالة الطاقة سالبة دائماً مع حركة السيستم، السيستم طبيعي هيهبط ويستقر عند نقطة الاتزان ومستحيل ينفجر أو يخرج عن السيطرة.',
    },
  ],
  matrixAnalysisTable: {
    headers: ['المعيار / الخاصية', 'تمثيل فضاء الحالة (State-Space)', 'دوال التحويل الكلاسيكية (Transfer Function)', 'الأهمية العملية في التصميم'],
    rows: [
      ['نوع الأنظمة المدعومة', 'أنظمة MIMO (متعددة المداخل والمخارج) و SISO', 'مقتصرة تقريباً على SISO فقط', 'التحكم في الطائرات والمركبات الفضائية والروبوتات الصناعية'],
      ['الشروط الابتدائية', 'تأخذ الشروط الابتدائية غير الصفرية x(0) في الحسبان مباشرة', 'تفترض دائماً شروطاً صفرية zero initial conditions', 'التعامل مع الصدمات المفاجئة وتشغيل الأنظمة من وضع التشغيل'],
      ['الشفافية الداخلية', 'تكشف جميع متغيرات الحالة الداخلية (التيارات، السرعات، الضغوط)', 'تعتبر النظام كصندوق أسود (Black Box) يربط الدخل بالخرج فقط', 'اكتشاف الأنماط غير المستقرة المخفية التي قد تدمر المعدة'],
      ['طريقة الحساب الرياضي', 'مصفوفات جبرية ومعادلات تفاضلية من الدرجة الأولى', 'حسابات كسور جبرية وأقطاب في مجال التردد s', 'سهولة التطبيق على الحواسب والمعالجات الرقمية (DSP/FPGA)'],
    ],
  },
  deepCurriculumContent: `### 1. الرؤية الهندسية الشاملة لتمثيل فضاء الحالة

يا باشمهندس، لما تيجي تصمم كنترولر لصاروخ فضائي أو ذراع روبوتيك، مينفعش تعتمد على معادلة تفاضلية من الدرجة العاشرة وتكتفي بنسبة الخرج على الدخل. تمثيل فضاء الحالة بيقوم على حيلة رياضية عبقرية:
تحويل أي معادلة تفاضلية من الدرجة $n$ إلى منظومة مكونة من $n$ معادلة تفاضلية من الدرجة الأولى بالصيغة الموحدة المسجلة في السجل أعلاه برمز [EQ-1].

بمجرد ما نوصل للصيغة دي، نقدر نكتب كل معادلات الفيزياء والحركة في شكل مصفوفات، وده بيخلي الماتلاب أو الكود بتاعك يحل السيستم في ميكرو ثانية عن طريق ضرب المصفوفات!

### 2. كيفية التحويل العملي من دوال التحويل إلى فضاء الحالة

عندنا كذا شكل قياسي مشهور (Canonical Forms):
- **الشكل المرافق للتحكم (Controllable Canonical Form):** بيخلي معاملات دالة التحويل تظهر مباشرة في الصف الأخير من المصفوفة $\\mathbf{A}$.
- **الشكل المرافق للمراقبة (Observable Canonical Form):** بيخلي المعاملات تظهر في العمود الأخير، وده مثالي لتصميم الـ Observers.
- **الشكل القطري (Diagonal or Jordan Form):** المصفوفة $\\mathbf{A}$ بتكون مصفوفة قطرية بتحتوي على القيم الذاتية (Eigenvalues)، وهنا كل متغير حالة بيكون مستقل تماماً عن التاني!

### 3. خطة التصميم العملي: مغذي الحالة الراجعة (State Feedback)

الهدف الحقيقي لأي مهندس تحكم مش مجرد تحليل السيستم، بل ترويضه!
لما بنقيس متجه الحالة ونضربه في كسب التغذية:
$$\\mathbf{u}(t) = -\\mathbf{K}\\mathbf{x}(t) + \\mathbf{r}(t)$$

بنعوض في المعادلة الأصلية، فيتحول النظام المغلق إلى:
$$\\dot{\\mathbf{x}}(t) = (\\mathbf{A} - \\mathbf{B}\\mathbf{K})\\mathbf{x}(t) + \\mathbf{B}\\mathbf{r}(t)$$

المصفوفة الجديدة $(\\mathbf{A} - \\mathbf{B}\\mathbf{K})$ هي اللي بتحدد استقرار وسرعة السيستم. باستخدام صيغة أكرمان المرجعية في السجل [EQ-7]، نقدر نختار الأقطاب الجديدة لتسريع زمن الاستقرار (Settling Time) وتقليل التجاوز (Overshoot) إلى الصفر تقريباً!`,
  uniquenessValidationLedger: {
    totalUniqueFormulasFound: 7,
    duplicateFormulasPrevented: 14,
    verificationNotice: 'Easy Anti-Repetition Engine has validated that every equation is indexed once and referenced only via unique IDs.',
  },
};
