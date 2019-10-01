create table users(
    id int not null auto_increment primary key,
    login varchar(50) not null,
    password varchar(255) not null
);

create table sections(
    id int primary key auto_increment,
    title varchar(255) not null,
    text text,
    branch varchar(50) not null
);

create table section_images(
    section_id int,
    url varchar(255),
    primary key(section_id, url),
    foreign key(section_id) references sections(id) on delete cascade
);