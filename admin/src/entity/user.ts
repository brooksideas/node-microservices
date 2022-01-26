import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    uid: number;

    @Column()
    first_name: string;

    @Column()
    last_name: string;

    @Column({default: ""})
    email: string;

    @Column({default: 18})
    age: number;
}
