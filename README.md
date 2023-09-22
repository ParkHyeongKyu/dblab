# Project

[dump.sql](https://drive.google.com/file/d/1UBAj7xbJa3tgTlfMkoiawm5k4B55GdQy/view?usp=drive_link) 파일을 프로젝트 폴더에 삽입해서 docker-compose를 실행하면 테스트할 수 있다.

dump.sql 파일은 직접 db에 넣어 주어야 한다.
```
cat dump.sql | docker compose exec -T db mysql -udg -ppassword dg
```

## dump.sql

db : dg

tables & view : 아래와 같다.
```
tables:
app_center_info
app_chemical_info_history
app_meterial_info
chemicalDangerByDate
dangerChangeByAction

views:
view_chemicals
view_inoutRecord
```
