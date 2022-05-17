import { tryToParse } from "../utility/helpers";

export const getTasks = (idleonData) => {
  const tasksRaw = idleonData?.Tasks || [
    tryToParse(idleonData?.TaskZZ0),
    tryToParse(idleonData?.TaskZZ1),
    tryToParse(idleonData?.TaskZZ2),
    tryToParse(idleonData?.TaskZZ3),
    tryToParse(idleonData?.TaskZZ4),
    tryToParse(idleonData?.TaskZZ5),
  ];
  return parseTasks(tasksRaw);
}

const parseTasks = (tasksRaw) => {
  return tasksRaw;
}