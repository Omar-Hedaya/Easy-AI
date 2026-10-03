export interface CurriculumPreset {
  id: string;
  discipline: string;
  title: string;
  subtitle: string;
  level: string;
  icon: string;
  sampleInput: string;
}

export const CURRICULUM_PRESETS: CurriculumPreset[] = [
  {
    id: 'eng-control-systems',
    discipline: 'Engineering',
    title: 'Advanced Modern Control Systems & State-Space',
    subtitle: 'Transfer functions, State-Space representation, Controllability, and Lyapunov Stability',
    level: 'Undergraduate / Master of Science',
    icon: 'Cpu',
    sampleInput: `Syllabus / Lecture Notes:
1. Dynamic System Modeling:
- State-space differential representations: \\dot{x}(t) = A x(t) + B u(t), and output equation y(t) = C x(t) + D u(t).
- State transition matrix \\Phi(t) = e^{At} = \\mathcal{L}^{-1}\\{(sI - A)^{-1}\\}.
- Transfer function from state-space: G(s) = C(sI - A)^{-1}B + D.
2. Controllability & Observability Criteria:
- Kalman Controllability Matrix: \\mathcal{C} = [B \\quad AB \\quad A^2B \\quad \\dots \\quad A^{n-1}B]. System is controllable iff \\text{rank}(\\mathcal{C}) = n.
- Kalman Observability Matrix: \\mathcal{O} = [C^T \\quad A^T C^T \\quad (A^T)^2 C^T \\quad \\dots \\quad (A^T)^{n-1} C^T]^T.
3. Stability Analysis:
- Characteristic polynomial: \\det(sI - A) = 0.
- Routh-Hurwitz stability criterion for high-order polynomials.
- Lyapunov direct method: Continuous Lyapunov equation A^T P + P A = -Q where Q > 0 and P > 0.
4. Full State Feedback Design:
- Pole placement using Ackermann's formula: K = [0 \\dots 0 \\ 1] \\mathcal{C}^{-1} \\alpha_c(A).`,
  },
  {
    id: 'math-multivariable-calculus',
    discipline: 'Mathematics',
    title: 'Vector Calculus & Differential Operators',
    subtitle: 'Gradient, Divergence, Curl, Surface Integrals, and the Fundamental Theorems of Stokes & Gauss',
    level: 'College / Applied Mathematics',
    icon: 'Sigma',
    sampleInput: `Curriculum Topics:
1. Vector Differential Operators in \\mathbb{R}^3:
- Del operator \\nabla = \\mathbf{i}\\frac{\\partial}{\\partial x} + \\mathbf{j}\\frac{\\partial}{\\partial y} + \\mathbf{k}\\frac{\\partial}{\\partial z}.
- Gradient of scalar field f: \\nabla f = \\left(\\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z}\\right).
- Divergence of vector field \\mathbf{F} = \\langle P, Q, R \\rangle: \\text{div} \\mathbf{F} = \\nabla \\cdot \\mathbf{F} = \\frac{\\partial P}{\\partial x} + \\frac{\\partial Q}{\\partial y} + \\frac{\\partial R}{\\partial z}.
- Curl of vector field \\mathbf{F}: \\text{curl} \\mathbf{F} = \\nabla \\times \\mathbf{F} = \\begin{vmatrix} \\mathbf{i} & \\mathbf{j} & \\mathbf{k} \\\\ \\frac{\\partial}{\\partial x} & \\frac{\\partial}{\\partial y} & \\frac{\\partial}{\\partial z} \\\\ P & Q & R \\end{vmatrix}.
2. Integral Theorems of Multivariable Calculus:
- Green's Theorem in the plane: \\oint_C (P\\,dx + Q\\,dy) = \\iint_D \\left(\\frac{\\partial Q}{\\partial x} - \\frac{\\partial P}{\\partial y}\\right) dA.
- Stokes' Theorem for oriented surface S bounded by curve C: \\oint_C \\mathbf{F} \\cdot d\\mathbf{r} = \\iint_S (\\nabla \\times \\mathbf{F}) \\cdot d\\mathbf{S}.
- Gauss's Divergence Theorem for closed volume V bounded by surface \\partial V: \\oiint_{\\partial V} \\mathbf{F} \\cdot d\\mathbf{S} = \\iiint_V (\\nabla \\cdot \\mathbf{F}) dV.
3. Path Independence & Conservative Vector Fields:
- Condition \\nabla \\times \\mathbf{F} = \\mathbf{0} on simply connected domain implies \\mathbf{F} = \\nabla f.`,
  },
  {
    id: 'nursing-critical-care',
    discipline: 'Nursing & Health Sciences',
    title: 'Critical Care Calculations & Hemodynamic Monitoring',
    subtitle: 'IV Infusions, Mean Arterial Pressure (MAP), Arterial Blood Gas (ABG), and Anion Gap',
    level: 'BSN Nursing / NCLEX / ICU Specialty',
    icon: 'HeartPulse',
    sampleInput: `Nursing Board / Clinical Care Core Curriculum:
1. Intravenous (IV) Dosage & Infusion Calculations:
- Flow rate in drops per minute: \\text{gtt/min} = \\frac{\\text{Total Volume (mL)} \\times \\text{Drop Factor (gtt/mL)}}{\\text{Time in Minutes (min)}}.
- Continuous microgram infusion rate (e.g. Dopamine, Norepinephrine): \\text{Rate (mL/hr)} = \\frac{\\text{Dose (mcg/kg/min)} \\times \\text{Weight (kg)} \\times 60}{\\text{Drug Concentration (mcg/mL)}}.
2. Hemodynamic Formulas:
- Mean Arterial Pressure (MAP): \\text{MAP} = \\frac{2 \\times \\text{Diastolic BP} + \\text{Systolic BP}}{3} \\ge 65 \\text{ mmHg for vital organ perfusion}.
- Cardiac Output (CO): \\text{CO} = \\text{Heart Rate (HR)} \\times \\text{Stroke Volume (SV)}.
- Systemic Vascular Resistance (SVR): \\text{SVR} = 80 \\times \\frac{\\text{MAP} - \\text{CVP}}{\\text{Cardiac Output}}.
3. Arterial Blood Gas (ABG) & Acid-Base Balance:
- Normal ranges: pH 7.35–7.45, PaCO2 35–45 mmHg, HCO3- 22–26 mEq/L.
- Henderson-Hasselbalch physiological expression: \\text{pH} = 6.1 + \\log_{10}\\left(\\frac{[\\text{HCO}_3^-]}{0.0306 \\times P_{\\text{CO}_2}}\\right).
- Serum Anion Gap (AG): \\text{AG} = [\\text{Na}^+] - ([\\text{Cl}^-] + [\\text{HCO}_3^-]) \\quad (\\text{Normal: } 8-12 \\text{ mEq/L}).`,
  },
  {
    id: 'physics-electrodynamics',
    discipline: 'Physics',
    title: 'Electrodynamics & Maxwellian Field Theory',
    subtitle: 'Maxwell equations in differential & integral forms, Poynting vector, and electromagnetic wave equations',
    level: 'Undergraduate Physics / Honors',
    icon: 'Zap',
    sampleInput: `Physics Curriculum Module:
1. Maxwell's Equations in Differential Form (SI units in vacuum):
- Gauss's Law for Electricity: \\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}.
- Gauss's Law for Magnetism: \\nabla \\cdot \\mathbf{B} = 0.
- Faraday's Law of Induction: \\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}.
- Ampère-Maxwell Law with displacement current: \\nabla \\times \\mathbf{B} = \\mu_0 \\mathbf{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t}.
2. Electromagnetic Energy & Conservation:
- Poynting vector: \\mathbf{S} = \\frac{1}{\\mu_0} (\\mathbf{E} \\times \\mathbf{B}).
- Poynting's Theorem of energy conservation: \\frac{\\partial u}{\\partial t} + \\nabla \\cdot \\mathbf{S} = -\\mathbf{J} \\cdot \\mathbf{E}.
3. Electromagnetic Wave Equation:
- In source-free vacuum (\\rho=0, \\mathbf{J}=0): \\nabla^2 \\mathbf{E} - \\mu_0\\varepsilon_0 \\frac{\\partial^2 \\mathbf{E}}{\\partial t^2} = 0.
- Speed of light relationship: c = \\frac{1}{\\sqrt{\\mu_0 \\varepsilon_0}} \\approx 2.99792 \\times 10^8 \\text{ m/s}.`,
  },
  {
    id: 'cs-algorithms-complexity',
    discipline: 'Computer Science',
    title: 'Graph Algorithms & Asymptotic Complexity Matrix',
    subtitle: 'Shortest path algorithms, Dynamic Programming, Master Theorem, and P vs NP Taxonomy',
    level: 'Undergraduate Computer Science / Masters',
    icon: 'Binary',
    sampleInput: `Computer Science Curriculum Specification:
1. Asymptotic Recurrences & Divide-and-Conquer:
- Master Theorem form: T(n) = a T(n/b) + f(n) where a \\ge 1, b > 1.
- Case 1: If f(n) = O(n^{\\log_b a - \\varepsilon}), then T(n) = \\Theta(n^{\\log_b a}).
- Case 2: If f(n) = \\Theta(n^{\\log_b a} \\log^k n), then T(n) = \\Theta(n^{\\log_b a} \\log^{k+1} n).
- Case 3: If f(n) = \\Omega(n^{\\log_b a + \\varepsilon}) and regularity condition holds, then T(n) = \\Theta(f(n)).
2. Graph Optimization Algorithms:
- Dijkstra's Algorithm (with Min-Heap): Time complexity O((V + E) \\log V), Space O(V).
- Bellman-Ford (detects negative weight cycles): Time complexity O(V \\cdot E), Relaxation: d[v] = \\min(d[v], d[u] + w(u, v)).
- Floyd-Warshall (All-Pairs Shortest Paths): Time complexity O(V^3), Matrix recurrence: d^{(k)}_{ij} = \\min(d^{(k-1)}_{ij}, d^{(k-1)}_{ik} + d^{(k-1)}_{kj}).
3. Space & Time Complexity Invariants:
- Zero duplication: Compare Dijkstra, Bellman-Ford, Floyd-Warshall, and Johnson's algorithm in a single canonical matrix.`,
  },
];
