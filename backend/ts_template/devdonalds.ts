import express, { Request, Response } from "express";


// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}


interface requiredItem {
  name: string;
  quantity: number;
}


interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}


interface ingredient extends cookbookEntry {
  cookTime: number;
}


// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());


// Store your recipes here!
let cookbook: any[] = [];


// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;


  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  }
  res.json({ msg: parsed_string });
  return;
 
});


// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that
const parse_handwriting = (recipeName: string): string | null => {
  // TODO: implement me
  let newName = recipeName.replace(/[-_]/g, ' ')
  .replace(/[^a-zA-Z\s]/g, '')
  .trim()
  .replace(/\s+/g, ' ')
  .toLowerCase()
  .split(' ')
  .map(word =>
    word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');


  if (newName.length <= 0) {
    return null;
  }
  return newName
}


// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  // TODO: implement me
  const entry = req.body;


  if (entry.type !== 'recipe' && entry.type !== 'ingredient') {
    return res.status(400).send('Invalid type');
  }


  const nameExists = cookbook.some(item => item.name === entry.name);
  if (nameExists) {
    return res.status(400).send('Entry name must be unique');
  }


  if (entry.type === 'ingredient') {
    if (typeof entry.cookTime !== 'number' || entry.cookTime < 0) {
      return res.status(400).send('cookTime must be >= 0');
    }
  }


  if (entry.type === 'recipe') {
    if (!Array.isArray(entry.requiredItems)) {
      return res.status(400).send('requiredItems must be an array');
    }
    const itemNames = entry.requiredItems.map(item => item.name);
    const duplicates = itemNames.some((val: string, i: number) => itemNames.indexOf(val) !== i);
   
    if (duplicates) {
      return res.status(400).send('Duplicate names in requiredItems');
    }
  }


  cookbook.push(entry);
  return res.status(200).send({});


});


// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  // TODO: implement me
  const name = req.query.name as string;
  const recipe = cookbook.find(item => item.name === name);


  if (!recipe || recipe.type !== 'recipe') {
    return res.status(400).send('Recipe not found');
  }


  try {
    const summary = getDetails(name, 1);
    return res.status(200).json(summary);
  } catch (error) {
    return res.status(400).send('Missing item');
  }


});


function getDetails(name: string, count: number) {
  const entry = cookbook.find(e => e.name === name);
  if (!entry) throw new Error();


  if (entry.type === 'ingredient') {
    return {
      cookTime: entry.cookTime * count,
      ingredients: [{ name: entry.name, quantity: count }]
    };
  }


  let totalTime = 0;
  const ingredientMap: Record<string, number> = {};


  for (const item of entry.requiredItems || []) {
    const details = getDetails(item.name, item.quantity * count);
    totalTime += details.cookTime;


    details.ingredients.forEach(i => {
      ingredientMap[i.name] = ingredientMap[i.name] + i.quantity;
    });
  }


  return {
    name: name,
    cookTime: totalTime,
    ingredients: Object.entries(ingredientMap).map(([name, quantity]) => ({
      name, quantity
    }))
  };
};
// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});



