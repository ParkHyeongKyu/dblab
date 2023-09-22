TYPE=VIEW
query=select `chem`.`c_code` AS `c_code`,`led`.`mi_code` AS `mi_code`,`led`.`ci_date` AS `date`,sum(greatest(0,`led`.`ci_count`)) AS `in_`,abs(sum(least(0,`led`.`ci_count`))) AS `out_` from (`dg`.`app_chemical_info_history` `led` join (select `chem`.`mi_code` AS `mi_code`,`chem`.`c_code` AS `c_code`,`chem`.`mi_name` AS `name` from `dg`.`app_material_info` `chem`) `chem` on((`led`.`mi_code` = `chem`.`mi_code`))) group by `chem`.`c_code`,`led`.`mi_code`,`date` order by `chem`.`c_code`,`date`
md5=45c8bb5ab4dd90e8eecf9276a5d9d66d
updatable=0
algorithm=0
definer_user=dg
definer_host=%
suid=2
with_check_option=0
timestamp=2023-09-22 04:18:06
create-version=1
source=select chem.c_code, led.mi_code, led.ci_date as date, sum(greatest(0, led.ci_count)) as in_, abs(sum(least(0, led.ci_count))) as out_\nfrom app_chemical_info_history led\ninner join( select mi_code, c_code, mi_name as name from app_material_info as chem ) as chem on led.mi_code = chem.mi_code\ngroup by chem.c_code, led.mi_code, date\norder by chem.c_code, date
client_cs_name=utf8mb4
connection_cl_name=utf8mb4_general_ci
view_body_utf8=select `chem`.`c_code` AS `c_code`,`led`.`mi_code` AS `mi_code`,`led`.`ci_date` AS `date`,sum(greatest(0,`led`.`ci_count`)) AS `in_`,abs(sum(least(0,`led`.`ci_count`))) AS `out_` from (`dg`.`app_chemical_info_history` `led` join (select `chem`.`mi_code` AS `mi_code`,`chem`.`c_code` AS `c_code`,`chem`.`mi_name` AS `name` from `dg`.`app_material_info` `chem`) `chem` on((`led`.`mi_code` = `chem`.`mi_code`))) group by `chem`.`c_code`,`led`.`mi_code`,`date` order by `chem`.`c_code`,`date`
