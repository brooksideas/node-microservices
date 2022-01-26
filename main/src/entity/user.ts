import {Column, Entity, ObjectIdColumn} from "typeorm";

@Entity()
export class User {
    @ObjectIdColumn()
    id: string;

    @Column({ unique: true })
    uid: number;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column({ default: "" })
    email: string;

    @Column({ default: 18 })
    age: number;
}
