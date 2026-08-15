export default class FactsPerson {
  personId: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;

  constructor(
    personId: number,
    firstName: string = "",
    lastName: string = "",
    username: string = "",
    email: string = "",
  ) {
    this.personId = personId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.username = username;
    this.email = email;
  }
}
