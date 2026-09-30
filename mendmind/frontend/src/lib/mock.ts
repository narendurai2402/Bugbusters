import type { PracticeCategory, QuestionDef } from "./types";

const MATH_QUESTIONS: QuestionDef[] = [
  { id: "q1", category: "Math", concept: "Adding fractions", text: "1/2 + 1/3 = ?", answers: ["5/6"],
    wrong: { "2/5": ["Adds tops and bottoms", 0.86] },
    recovery: { text: "1/4 + 1/5 = ?", answers: ["9/20"], wrong: "2/9" },
    ladder: ["Walk me through it: what did you do with the two denominators?",
      "Hint: you can only add pieces of the same size. What common denominator fits 2 and 3?",
      "Explanation: 1/2 = 3/6 and 1/3 = 2/6, so 3/6 + 2/6 = 5/6. Denominators name the piece size, so they are not added."] },
  { id: "q2", category: "Math", concept: "Comparing fractions", text: "Which is bigger: 1/3 or 1/5?", answers: ["1/3"],
    wrong: { "1/5": ["Bigger denominator means bigger fraction", 0.81] },
    recovery: { text: "Which is bigger: 1/4 or 1/8?", answers: ["1/4"], wrong: "1/8" },
    ladder: ["Picture a pizza cut into 3 slices, then 5. Which slice is larger, and why?",
      "Hint: the more pieces a whole is cut into, the smaller each piece gets.",
      "Explanation: 1/3 = 5/15 and 1/5 = 3/15, so 1/3 is bigger."] },
  { id: "q3", category: "Math", concept: "Simplifying fractions", text: "Simplify 6/8", answers: ["3/4", "0.75"],
    wrong: { "3/8": ["Divides only the numerator", 0.78] },
    recovery: { text: "Simplify 4/10", answers: ["2/5", "0.4"], wrong: "2/10" },
    ladder: ["What can you divide the top by? Did you do the same to the bottom?",
      "Hint: whatever you divide the numerator by, the denominator gets the same treatment.",
      "Explanation: divide both 6 and 8 by 2 to get 3/4."] },
  { id: "q4", category: "Math", concept: "Multiplying decimals", text: "What is 1.2 × 0.5?", answers: ["0.6", "0.60"],
    wrong: { "6": ["Misplaces the decimal point", 0.84] },
    recovery: { text: "What is 0.8 × 0.5?", answers: ["0.4", "0.40"], wrong: "4" },
    ladder: ["Estimate first: 1.2 is about 1, times 0.5 is about half.",
      "Hint: multiply 12 × 5, then place the decimal so there are 2 total digits after the decimal point.",
      "Explanation: 1.2 × 0.5 = 0.6 because 12 × 5 = 60 and 60 becomes 0.60."] },
  { id: "q5", category: "Math", concept: "Percentages", text: "30% of 80 is what?", answers: ["24"],
    wrong: { "8": ["Uses 10% instead of 30%", 0.8] },
    recovery: { text: "20% of 50 is what?", answers: ["10"], wrong: "5" },
    ladder: ["Think of 30% as 3 groups of 10%.",
      "Hint: find 10% first, then multiply by 3.",
      "Explanation: 10% of 80 is 8, so 30% is 3 × 8 = 24."] },
  { id: "q6", category: "Math", concept: "Solving equations", text: "Solve x + 7 = 15", answers: ["8"],
    wrong: { "22": ["Adds instead of subtracting", 0.81] },
    recovery: { text: "Solve x - 4 = 9", answers: ["13"], wrong: "5" },
    ladder: ["What operation undoes adding 7?",
      "Hint: subtract 7 from both sides.",
      "Explanation: x + 7 = 15 means x = 15 - 7 = 8."] },
  { id: "q7", category: "Math", concept: "Ratios", text: "If the ratio of apples to oranges is 2:3 and there are 12 apples, how many oranges?", answers: ["18"],
    wrong: { "8": ["Uses the wrong part of the ratio", 0.78] },
    recovery: { text: "If the ratio of red to blue marbles is 1:4 and there are 5 red marbles, how many blue marbles?", answers: ["20"], wrong: "4" },
    ladder: ["How much does each ratio unit represent?",
      "Hint: 2 parts correspond to 12 apples, so each part is 6.",
      "Explanation: 12 ÷ 2 = 6, so 3 parts = 18 oranges."] },
  { id: "q8", category: "Math", concept: "Area of rectangle", text: "A rectangle is 6 cm by 4 cm. What is its area?", answers: ["24cm2", "24 cm2", "24 sq cm", "24"],
    wrong: { "10": ["Adds instead of multiplies", 0.77] },
    recovery: { text: "A rectangle is 3 cm by 5 cm. What is its area?", answers: ["15cm2", "15 cm2", "15"], wrong: "8" },
    ladder: ["Area means how many square units fit inside the rectangle.",
      "Hint: multiply length by width.",
      "Explanation: 6 × 4 = 24 square centimeters."] },
];

const DSA_QUESTIONS: QuestionDef[] = [
  { id: "d1", category: "DSA", concept: "Binary Search", text: "In the sorted array [2, 4, 6, 8, 10], which index holds 8?", answers: ["3"],
    wrong: { "4": ["Off-by-one index error", 0.8] },
    recovery: { text: "In [1, 3, 5, 7, 9], which index holds 5?", answers: ["2"], wrong: "3" },
    ladder: ["Think about zero-based indexing. Which position is the middle value of the array?",
      "Hint: the array is sorted; compare the target with the middle element, then move left or right.",
      "Explanation: 8 is the 4th element in a zero-based array, so its index is 3."] },
  { id: "d2", category: "DSA", concept: "Queue", text: "Which data structure uses FIFO ordering?", answers: ["queue"],
    wrong: { "stack": ["Confuses FIFO with LIFO", 0.82] },
    recovery: { text: "Which data structure removes the most recently added item first?", answers: ["stack"], wrong: "queue" },
    ladder: ["What happens to the first item that was inserted?",
      "Hint: FIFO means First In, First Out. Which structure always removes the oldest item first?",
      "Explanation: a queue processes items in arrival order, whereas a stack works LIFO."] },
  { id: "d3", category: "DSA", concept: "Time Complexity", text: "What is the time complexity of binary search on n elements?", answers: ["o(log n)", "o(logn)", "O(log n)", "O(logn)"],
    wrong: { "O(n)": ["Confuses binary search with a linear scan", 0.79] },
    recovery: { text: "What is the time complexity of scanning every element in an array of length n?", answers: ["O(n)", "o(n)"], wrong: "O(log n)" },
    ladder: ["Binary search halves the search space each step. How much does the search space shrink?",
      "Hint: repeated halving is logarithmic growth, not linear growth.",
      "Explanation: each comparison cuts the remaining elements in half, so the cost is O(log n)."] },
  { id: "d4", category: "DSA", concept: "Hash map", text: "What is the average time complexity for a key lookup in a hash map?", answers: ["O(1)", "o(1)"],
    wrong: { "O(n)": ["Treats hashing as linear search", 0.8] },
    recovery: { text: "What is the worst-case lookup time for a hash map if many keys collide?", answers: ["O(n)", "o(n)"], wrong: "O(1)" },
    ladder: ["What happens after the key is hashed?",
      "Hint: hashing usually maps directly to an index, so the lookup is near constant time.",
      "Explanation: average-case lookup is O(1) because the key is converted to an index and accessed directly."] },
  { id: "d5", category: "DSA", concept: "Stack", text: "Which data structure removes the most recently added item first?", answers: ["stack"],
    wrong: { "queue": ["Confuses LIFO with FIFO", 0.82] },
    recovery: { text: "Which structure processes items in arrival order?", answers: ["queue"], wrong: "stack" },
    ladder: ["Which item is at the top of the stack?",
      "Hint: LIFO means Last In, First Out.",
      "Explanation: stacks remove the newest item first, unlike queues which remove the oldest item first."] },
  { id: "d6", category: "DSA", concept: "Linked list traversal", text: "What is the runtime to find a target value in a singly linked list of length n?", answers: ["O(n)", "o(n)"],
    wrong: { "O(1)": ["Assumes direct indexing like an array", 0.79] },
    recovery: { text: "What is the runtime to access the last element of a singly linked list by index?", answers: ["O(n)", "o(n)"], wrong: "O(1)" },
    ladder: ["Can you jump directly to the middle or end of a linked list?",
      "Hint: you have to walk node by node.",
      "Explanation: without random access, you must traverse the list in sequence, so it is O(n)."] },
  { id: "d7", category: "DSA", concept: "Depth-first search", text: "DFS commonly uses which data structure to track the current path?", answers: ["stack"],
    wrong: { "queue": ["Uses breadth-first traversal pattern", 0.81] },
    recovery: { text: "BFS usually explores nodes in which order?", answers: ["queue"], wrong: "stack" },
    ladder: ["Which structure naturally supports backtracking?",
      "Hint: DFS goes deep before wide, often using a stack for recursion or explicit tracking.",
      "Explanation: DFS uses stack-like behavior to revisit previous nodes as it explores deeper branches."] },
  { id: "d8", category: "DSA", concept: "Big O notation", text: "Which is smaller growth: O(log n) or O(n)?", answers: ["o(log n)", "O(log n)", "log n"],
    wrong: { "O(n)": ["Confuses logarithmic growth with linear growth", 0.81] },
    recovery: { text: "Which grows faster as n increases: O(1) or O(log n)?", answers: ["O(log n)", "o(log n)", "log n"], wrong: "O(1)" },
    ladder: ["Think about how many times you can halve a number before getting to 1.",
      "Hint: logarithmic growth is much slower than linear growth.",
      "Explanation: O(log n) grows much more slowly than O(n); repeated halving is smaller than checking each element."] },
];

const SCIENCE_QUESTIONS: QuestionDef[] = [
  {
    "id": "s1",
    "category": "Science",
    "concept": "Gravity and falling",
    "text": "In a vacuum, which hits the ground first: a 1 kg ball or a 10 kg ball dropped together?",
    "answers": [
      "neither",
      "same",
      "both",
      "at the same time",
      "together",
      "they land together"
    ],
    "wrong": {
      "10 kg": [
        "Heavier objects fall faster",
        0.85
      ],
      "10kg ball": [
        "Heavier objects fall faster",
        0.85
      ],
      "the 10 kg ball": [
        "Heavier objects fall faster",
        0.85
      ]
    },
    "recovery": {
      "text": "In a vacuum, which hits first: a 2 kg rock or a 5 kg rock dropped together?",
      "answers": [
        "neither",
        "same",
        "both",
        "at the same time",
        "together"
      ],
      "wrong": "5 kg"
    },
    "ladder": [
      "What is pulling both balls down, and does that pull depend on how heavy the ball is?",
      "Hint: a heavier ball has more gravity pulling on it, but it also has more mass to move. What happens to the acceleration?",
      "Explanation: with no air, all objects accelerate at the same rate (about 9.8 m/s2), so both land together."
    ]
  },
  {
    "id": "s2",
    "category": "Science",
    "concept": "Seasons",
    "text": "What mainly causes the seasons on Earth?",
    "answers": [
      "tilt",
      "axial tilt",
      "earth's tilt",
      "the tilt of earth's axis",
      "axis tilt",
      "tilt of the axis"
    ],
    "wrong": {
      "distance from the sun": [
        "Seasons come from distance to the Sun",
        0.83
      ],
      "distance": [
        "Seasons come from distance to the Sun",
        0.83
      ],
      "closer to the sun": [
        "Seasons come from distance to the Sun",
        0.83
      ]
    },
    "recovery": {
      "text": "When it is summer in Canada, is it winter in Australia? (yes/no)",
      "answers": [
        "yes"
      ],
      "wrong": "no"
    },
    "ladder": [
      "If distance caused seasons, would both hemispheres have summer at the same time?",
      "Hint: Earth's axis is tilted about 23.5 degrees. What does that change about how sunlight hits each hemisphere?",
      "Explanation: the tilt makes one hemisphere receive more direct sunlight for longer days, so seasons are opposite in the two hemispheres."
    ]
  },
  {
    "id": "s3",
    "category": "Science",
    "concept": "Conservation of mass",
    "text": "When ice melts into water, does its mass increase, decrease, or stay the same?",
    "answers": [
      "stay the same",
      "stays the same",
      "same",
      "unchanged",
      "stays same"
    ],
    "wrong": {
      "decrease": [
        "Thinks matter disappears in a change of state",
        0.78
      ],
      "decreases": [
        "Thinks matter disappears in a change of state",
        0.78
      ],
      "increase": [
        "Thinks matter appears in a change of state",
        0.7
      ]
    },
    "recovery": {
      "text": "Water boils in a sealed pot. Does the total mass increase, decrease, or stay the same?",
      "answers": [
        "stay the same",
        "stays the same",
        "same",
        "unchanged"
      ],
      "wrong": "decrease"
    },
    "ladder": [
      "Where do the particles of ice go when it melts?",
      "Hint: melting changes how the particles are arranged, not how many there are.",
      "Explanation: a change of state does not add or remove matter, so the mass stays the same."
    ]
  },
  {
    "id": "s4",
    "category": "Science",
    "concept": "Force and motion",
    "text": "A ball rolls across a frictionless floor. Is a continuous push needed to keep it moving? (yes/no)",
    "answers": [
      "no"
    ],
    "wrong": {
      "yes": [
        "Believes motion needs a constant force",
        0.84
      ]
    },
    "recovery": {
      "text": "A puck slides on frictionless ice. Is a force needed to keep it moving at the same speed? (yes/no)",
      "answers": [
        "no"
      ],
      "wrong": "yes"
    },
    "ladder": [
      "What does a moving object do if nothing pushes or pulls it?",
      "Hint: Newton's first law says an object keeps its velocity unless a net force acts on it.",
      "Explanation: force changes motion, it is not needed to maintain it. Without friction the ball keeps rolling."
    ]
  },
  {
    "id": "s5",
    "category": "Science",
    "concept": "Electric current",
    "text": "In a simple circuit, is current 'used up' by the bulb? (yes/no)",
    "answers": [
      "no"
    ],
    "wrong": {
      "yes": [
        "Thinks current is used up by components",
        0.8
      ]
    },
    "recovery": {
      "text": "In a series circuit, is the current the same before and after the bulb? (yes/no)",
      "answers": [
        "yes"
      ],
      "wrong": "no"
    },
    "ladder": [
      "If current were used up, what would happen to the charge that flows into the bulb?",
      "Hint: charge is conserved. The bulb transfers energy, not charge.",
      "Explanation: the same current flows back to the battery. What the bulb uses up is energy, not current."
    ]
  },
  {
    "id": "s6",
    "category": "Science",
    "concept": "Heat and temperature",
    "text": "Which has the higher temperature: a bathtub of 40 C water or a cup of 60 C water?",
    "answers": [
      "cup",
      "the cup",
      "60",
      "60 c",
      "cup of water"
    ],
    "wrong": {
      "bathtub": [
        "Confuses total heat with temperature",
        0.79
      ],
      "the bathtub": [
        "Confuses total heat with temperature",
        0.79
      ],
      "40": [
        "Confuses total heat with temperature",
        0.79
      ]
    },
    "recovery": {
      "text": "Which has the higher temperature: a lake at 15 C or a mug at 70 C?",
      "answers": [
        "mug",
        "the mug",
        "70",
        "70 c"
      ],
      "wrong": "lake"
    },
    "ladder": [
      "What does a thermometer reading tell you: how much heat there is in total, or how hot each particle is on average?",
      "Hint: the bathtub holds more heat energy overall, but temperature is an average per particle.",
      "Explanation: temperature does not depend on amount. The 60 C cup is hotter even though the bathtub holds more total heat."
    ]
  },
  {
    "id": "s7",
    "category": "Science",
    "concept": "Plant growth",
    "text": "Where do plants get most of the mass they use to build their bodies?",
    "answers": [
      "air",
      "the air",
      "carbon dioxide",
      "co2"
    ],
    "wrong": {
      "soil": [
        "Thinks plant mass comes from soil",
        0.82
      ],
      "the soil": [
        "Thinks plant mass comes from soil",
        0.82
      ],
      "dirt": [
        "Thinks plant mass comes from soil",
        0.82
      ],
      "water": [
        "Thinks plant mass comes from soil or water only",
        0.7
      ]
    },
    "recovery": {
      "text": "Which gas do plants take in from the air to make sugar?",
      "answers": [
        "carbon dioxide",
        "co2"
      ],
      "wrong": "oxygen"
    },
    "ladder": [
      "A tree grows huge but the soil around it barely shrinks. What does that tell you?",
      "Hint: plants build sugar from carbon dioxide and water using light.",
      "Explanation: most plant mass is carbon that comes from CO2 in the air through photosynthesis, not from the soil."
    ]
  },
  {
    "id": "s8",
    "category": "Science",
    "concept": "Moon phases",
    "text": "Are the phases of the Moon caused by Earth's shadow falling on it? (yes/no)",
    "answers": [
      "no"
    ],
    "wrong": {
      "yes": [
        "Thinks Earth's shadow causes Moon phases",
        0.83
      ]
    },
    "recovery": {
      "text": "Is a lunar eclipse the same thing as a normal Moon phase? (yes/no)",
      "answers": [
        "no"
      ],
      "wrong": "yes"
    },
    "ladder": [
      "Can you see a crescent Moon when the Moon is in Earth's shadow?",
      "Hint: half of the Moon is always lit by the Sun. Phases depend on how much of that lit half we can see.",
      "Explanation: phases come from the Moon's orbit changing our viewing angle of its lit half. Earth's shadow only causes eclipses."
    ]
  },
];

const PYTHON_QUESTIONS: QuestionDef[] = [
  { id: "p1", category: "Python", concept: "Python functions", text: "Which keyword starts a function definition in Python?", answers: ["def"],
    wrong: { "function": ["Confuses Python syntax with other languages", 0.82] },
    recovery: { text: "Which keyword starts a class definition in Python?", answers: ["class"], wrong: "def" },
    ladder: ["Look at the first word in a Python function declaration.", "Hint: the keyword is short and comes before the function name.", "Explanation: Python uses `def` to define a function."] },
  { id: "p2", category: "Python", concept: "Python lists", text: "What is the result of len([4, 7, 9])?", answers: ["3"],
    wrong: { "2": ["Confuses the last index with the number of items", 0.8] },
    recovery: { text: "How many items are in [\"a\", \"b\"]?", answers: ["2"], wrong: "1" },
    ladder: ["Count each value in the list.", "Hint: `len` counts items, not the index of the last item.", "Explanation: the list contains three items, so `len([4, 7, 9])` is 3."] },
  { id: "p3", category: "Python", concept: "Python list methods", text: "Which list method adds an item to the end of a Python list?", answers: ["append"],
    wrong: { "add": ["Assumes Python lists use a generic add method", 0.78] },
    recovery: { text: "Which list method removes and returns the last item?", answers: ["pop"], wrong: "append" },
    ladder: ["Think of the method used like `items.<method>(value)`.", "Hint: it means to attach another item at the end.", "Explanation: `append(value)` adds a value to the end of a Python list."] },
];

const JAVA_QUESTIONS: QuestionDef[] = [
  { id: "j1", category: "Java", concept: "Java entry point", text: "What is the name of the standard Java application entry-point method?", answers: ["main"],
    wrong: { "start": ["Confuses the entry point with a descriptive label", 0.8] },
    recovery: { text: "What is the name of the Java method that commonly prints a line to the console?", answers: ["println", "print"], wrong: "main" },
    ladder: ["Recall the method declared inside `public static void ...`.", "Hint: it is the short name used by the Java launcher.", "Explanation: Java starts a standard application by calling its `main` method."] },
  { id: "j2", category: "Java", concept: "Java primitive types", text: "Which Java primitive type is commonly used to store a whole number?", answers: ["int"],
    wrong: { "integer": ["Confuses the primitive type with its wrapper class", 0.82] },
    recovery: { text: "Which Java primitive type stores a true-or-false value?", answers: ["boolean"], wrong: "int" },
    ladder: ["Choose the short primitive type, not a class name.", "Hint: it is also used in declarations such as `int count = 3;`.", "Explanation: `int` is Java's primitive type for whole numbers."] },
  { id: "j3", category: "Java", concept: "Java object creation", text: "Which Java keyword creates a new object from a class?", answers: ["new"],
    wrong: { "create": ["Uses an English verb instead of Java syntax", 0.78] },
    recovery: { text: "Which keyword declares a class in Java?", answers: ["class"], wrong: "new" },
    ladder: ["Look at the keyword before a constructor call.", "Hint: object creation looks like `new TypeName()`.", "Explanation: Java uses the `new` keyword to create an object."] },
];

// 1 = easy, 2 = medium, 3 = hard (mirrors DIFFICULTY in backend/questions.py)
const DIFFICULTY: Record<string, 1 | 2 | 3> = {
  q1: 2, q2: 1, q3: 1, q4: 2, q5: 1, q6: 1, q7: 3, q8: 1,
  d1: 2, d2: 1, d3: 2, d4: 2, d5: 1, d6: 2, d7: 3, d8: 1,
  s1: 2, s2: 2, s3: 2, s4: 3, s5: 3, s6: 3, s7: 2, s8: 1,
  p1: 1, p2: 1, p3: 2,
  j1: 1, j2: 1, j3: 2,
};

export const QUESTIONS: QuestionDef[] = [...MATH_QUESTIONS, ...DSA_QUESTIONS, ...SCIENCE_QUESTIONS, ...PYTHON_QUESTIONS, ...JAVA_QUESTIONS].map((q) => ({
  ...q,
  difficulty: DIFFICULTY[q.id] ?? 2,
}));
export const CONCEPTS = QUESTIONS.map((q) => q.concept);

export const CATEGORIES: PracticeCategory[] = ["Math", "DSA", "Science", "Python", "Java"];

export const QUESTION_BANKS: Record<PracticeCategory, QuestionDef[]> = {
  Math: QUESTIONS.filter((q) => q.category === "Math"),
  DSA: QUESTIONS.filter((q) => q.category === "DSA"),
  Science: QUESTIONS.filter((q) => q.category === "Science"),
  Python: QUESTIONS.filter((q) => q.category === "Python"),
  Java: QUESTIONS.filter((q) => q.category === "Java"),
};

/** concept name -> subject, e.g. "Stack" -> "DSA" */
export const SUBJECT_OF: Record<string, PracticeCategory> = Object.fromEntries(
  QUESTIONS.map((q) => [q.concept, q.category])
);

export function getQuestionsByCategory(category: PracticeCategory = "Math") {
  return QUESTION_BANKS[category];
}

export const STUDENTS: { name: string; mastery: number[] }[] = [];

export const TOP_MISCONCEPTIONS: [string, number][] = [];
