import { v4 as uuidv4 } from "uuid";

export const generateId = () => {
  console.log("generating id");
  const id = uuidv4();

  console.log("id: ", id);
  return id;
};
