import FactsPerson from "./FactsPerson";

export default class FactsRelationship {
  parent: FactsPerson;
  children: FactsPerson[];

  constructor(
    parent: FactsPerson,
    children: FactsPerson[],
  ) {
    this.parent = parent;
    this.children = children;
  }
}
