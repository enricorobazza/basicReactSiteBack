create table users(
    id int not null auto_increment primary key,
    login varchar(50) not null,
    password varchar(255) not null
);