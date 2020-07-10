create database if not exists news2inbox;

use news2inbox;

create table if not exists users (
  uid int auto_increment,
  username varchar(50) not null,
  user_email varchar(100) not null,
  password varchar(260) not null,
  primary key(uid),
  unique(user_email)
);

create table if not exists subscribe (
  record_id int auto_increment,
  countries varchar(10) not null,
  categories varchar(100) default null,
  /* number_of_total_articles int not null, */
  uid int,
  primary key (record_id),
  foreign key (uid) references users(uid),
  unique (uid)
);

create table if not exists profile (
  uid int,
  type enum('paid', 'normal') not null,
  avatar varchar(300) default null,
  foreign key (uid) references users(uid)
)