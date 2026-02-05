--
-- PostgreSQL database dump
--

\restrict jdNZfpXh6MRdg4RNhN3dLxFImxlswTGzcFyGLIxfrslSAmrFaM070EmCFu9uzgx

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-02-03 10:35:01

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 5963 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 951 (class 1247 OID 29174)
-- Name: achieved_difficulty_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.achieved_difficulty_enum AS ENUM (
    'EASY',
    'NORMAL',
    'CHALLENGING',
    'DIFFICULT'
);


ALTER TYPE public.achieved_difficulty_enum OWNER TO postgres;

--
-- TOC entry 1095 (class 1247 OID 32630)
-- Name: admin_owner_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.admin_owner_enum AS ENUM (
    'ADMIN',
    'OWNER'
);


ALTER TYPE public.admin_owner_enum OWNER TO postgres;

--
-- TOC entry 1065 (class 1247 OID 32472)
-- Name: appointment_booked_by_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_booked_by_enum AS ENUM (
    'PARENT',
    'DOCTOR',
    'ASSISTANT'
);


ALTER TYPE public.appointment_booked_by_enum OWNER TO postgres;

--
-- TOC entry 1068 (class 1247 OID 32480)
-- Name: appointment_reason_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_reason_enum AS ENUM (
    'ROUTINE_CHECKUP',
    'VACCINATION',
    'FOLLOW_UP',
    'GROWTH_MONITORING',
    'NUTRITION_CONSULT',
    'ILLNESS_CONSULT',
    'EMERGENCY',
    'OTHER'
);


ALTER TYPE public.appointment_reason_enum OWNER TO postgres;

--
-- TOC entry 1071 (class 1247 OID 32498)
-- Name: appointment_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.appointment_status_enum AS ENUM (
    'BOOKED',
    'CHECKED_IN',
    'CANCELLED',
    'NO_SHOW',
    'COMPLETED'
);


ALTER TYPE public.appointment_status_enum OWNER TO postgres;

--
-- TOC entry 1032 (class 1247 OID 32320)
-- Name: custom_drug_dosage_form_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.custom_drug_dosage_form_enum AS ENUM (
    'TABLET',
    'CAPSULE',
    'SYRUP',
    'SUSPENSION',
    'INJECTABLE',
    'DROP',
    'OTHER'
);


ALTER TYPE public.custom_drug_dosage_form_enum OWNER TO postgres;

--
-- TOC entry 1077 (class 1247 OID 32543)
-- Name: custom_drug_strength_unit_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.custom_drug_strength_unit_enum AS ENUM (
    'MG',
    'MCG',
    'G',
    'ML',
    'IU',
    'PERCENT'
);


ALTER TYPE public.custom_drug_strength_unit_enum OWNER TO postgres;

--
-- TOC entry 1179 (class 1247 OID 33098)
-- Name: diagnosis_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.diagnosis_type_enum AS ENUM (
    'PRIMARY',
    'SECONDARY'
);


ALTER TYPE public.diagnosis_type_enum OWNER TO postgres;

--
-- TOC entry 1083 (class 1247 OID 32574)
-- Name: doctor_availability_day_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_availability_day_enum AS ENUM (
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
    'SUN'
);


ALTER TYPE public.doctor_availability_day_enum OWNER TO postgres;

--
-- TOC entry 1122 (class 1247 OID 32758)
-- Name: doctor_place_role_document_reviewed_by_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_place_role_document_reviewed_by_type_enum AS ENUM (
    'ADMIN',
    'OWNER'
);


ALTER TYPE public.doctor_place_role_document_reviewed_by_type_enum OWNER TO postgres;

--
-- TOC entry 1119 (class 1247 OID 32750)
-- Name: doctor_place_role_document_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_place_role_document_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.doctor_place_role_document_status_enum OWNER TO postgres;

--
-- TOC entry 1116 (class 1247 OID 32735)
-- Name: doctor_place_role_document_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_place_role_document_type_enum AS ENUM (
    'CLINIC_LICENSE',
    'SHOP_ACT',
    'HOSPITAL_AUTHORIZATION',
    'RENT_AGREEMENT',
    'UTILITY_BILL',
    'OWNER_DECLARATION',
    'OTHER'
);


ALTER TYPE public.doctor_place_role_document_type_enum OWNER TO postgres;

--
-- TOC entry 1089 (class 1247 OID 32614)
-- Name: doctor_place_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_place_role_enum AS ENUM (
    'OWNER',
    'CONSULTING',
    'ASSISTANT'
);


ALTER TYPE public.doctor_place_role_enum OWNER TO postgres;

--
-- TOC entry 1092 (class 1247 OID 32622)
-- Name: doctor_place_role_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_place_role_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'removed'
);


ALTER TYPE public.doctor_place_role_status_enum OWNER TO postgres;

--
-- TOC entry 1041 (class 1247 OID 32375)
-- Name: doctor_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public.doctor_status_enum OWNER TO postgres;

--
-- TOC entry 1044 (class 1247 OID 32382)
-- Name: doctor_status_set_by_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_status_set_by_enum AS ENUM (
    'ADMIN'
);


ALTER TYPE public.doctor_status_set_by_enum OWNER TO postgres;

--
-- TOC entry 1053 (class 1247 OID 32412)
-- Name: doctor_verification_document_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_verification_document_status_enum AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public.doctor_verification_document_status_enum OWNER TO postgres;

--
-- TOC entry 1050 (class 1247 OID 32403)
-- Name: doctor_verification_document_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.doctor_verification_document_type_enum AS ENUM (
    'MEDICAL_REGISTRATION',
    'DEGREE_CERTIFICATE',
    'GOVERNMENT_ID',
    'OTHER'
);


ALTER TYPE public.doctor_verification_document_type_enum OWNER TO postgres;

--
-- TOC entry 954 (class 1247 OID 29184)
-- Name: food_age_group_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.food_age_group_enum AS ENUM (
    'INFANT',
    'TODDLER',
    'PRESCHOOL',
    'SCHOOLAGE',
    'ALL'
);


ALTER TYPE public.food_age_group_enum OWNER TO postgres;

--
-- TOC entry 957 (class 1247 OID 29196)
-- Name: illness_severity_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.illness_severity_enum AS ENUM (
    'MILD',
    'MODERATE',
    'SEVERE',
    'CRITICAL'
);


ALTER TYPE public.illness_severity_enum OWNER TO postgres;

--
-- TOC entry 1242 (class 1247 OID 33402)
-- Name: injection_administered_by_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.injection_administered_by_enum AS ENUM (
    'DOCTOR',
    'NURSE',
    'STAFF'
);


ALTER TYPE public.injection_administered_by_enum OWNER TO postgres;

--
-- TOC entry 1239 (class 1247 OID 33394)
-- Name: injection_dose_unit_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.injection_dose_unit_enum AS ENUM (
    'MG',
    'ML',
    'IU'
);


ALTER TYPE public.injection_dose_unit_enum OWNER TO postgres;

--
-- TOC entry 1233 (class 1247 OID 33376)
-- Name: injection_drug_source_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.injection_drug_source_enum AS ENUM (
    'CSV',
    'CUSTOM'
);


ALTER TYPE public.injection_drug_source_enum OWNER TO postgres;

--
-- TOC entry 1236 (class 1247 OID 33382)
-- Name: injection_route_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.injection_route_enum AS ENUM (
    'IV',
    'IM',
    'SC',
    'INTRADERMAL',
    'OTHER'
);


ALTER TYPE public.injection_route_enum OWNER TO postgres;

--
-- TOC entry 960 (class 1247 OID 29206)
-- Name: meal_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.meal_type_enum AS ENUM (
    'BREAKFAST',
    'MID_MORNING',
    'LUNCH',
    'EVENING_SNACK',
    'DINNER',
    'OTHER'
);


ALTER TYPE public.meal_type_enum OWNER TO postgres;

--
-- TOC entry 1251 (class 1247 OID 33440)
-- Name: medicine_dosage_form_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.medicine_dosage_form_enum AS ENUM (
    'TABLET',
    'CAPSULE',
    'SYRUP',
    'SUSPENSION',
    'DROP',
    'INHALER',
    'OINTMENT',
    'OTHER'
);


ALTER TYPE public.medicine_dosage_form_enum OWNER TO postgres;

--
-- TOC entry 1248 (class 1247 OID 33434)
-- Name: medicine_drug_source_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.medicine_drug_source_enum AS ENUM (
    'CSV',
    'CUSTOM'
);


ALTER TYPE public.medicine_drug_source_enum OWNER TO postgres;

--
-- TOC entry 1257 (class 1247 OID 33468)
-- Name: medicine_meal_relation_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.medicine_meal_relation_enum AS ENUM (
    'BEFORE_MEAL',
    'AFTER_MEAL',
    'WITH_MEAL',
    'ANYTIME'
);


ALTER TYPE public.medicine_meal_relation_enum OWNER TO postgres;

--
-- TOC entry 1254 (class 1247 OID 33458)
-- Name: medicine_route_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.medicine_route_enum AS ENUM (
    'ORAL',
    'INHALATION',
    'TOPICAL',
    'OTHER'
);


ALTER TYPE public.medicine_route_enum OWNER TO postgres;

--
-- TOC entry 1059 (class 1247 OID 32444)
-- Name: place_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.place_type_enum AS ENUM (
    'CLINIC',
    'HOSPITAL',
    'TELE'
);


ALTER TYPE public.place_type_enum OWNER TO postgres;

--
-- TOC entry 1206 (class 1247 OID 33247)
-- Name: prescription_item_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.prescription_item_type_enum AS ENUM (
    'MEDICINE',
    'INJECTION',
    'VACCINE',
    'PROCEDURE',
    'OTHER'
);


ALTER TYPE public.prescription_item_type_enum OWNER TO postgres;

--
-- TOC entry 1263 (class 1247 OID 33508)
-- Name: procedure_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.procedure_type_enum AS ENUM (
    'NEBULIZATION',
    'THERAPY',
    'MINOR_PROCEDURE',
    'OTHER'
);


ALTER TYPE public.procedure_type_enum OWNER TO postgres;

--
-- TOC entry 1128 (class 1247 OID 32788)
-- Name: queue_access_actor_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.queue_access_actor_type_enum AS ENUM (
    'DOCTOR',
    'STAFF'
);


ALTER TYPE public.queue_access_actor_type_enum OWNER TO postgres;

--
-- TOC entry 1155 (class 1247 OID 32948)
-- Name: queue_assignment_actor_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.queue_assignment_actor_type_enum AS ENUM (
    'DOCTOR',
    'STAFF'
);


ALTER TYPE public.queue_assignment_actor_type_enum OWNER TO postgres;

--
-- TOC entry 1104 (class 1247 OID 32674)
-- Name: queue_closed_by_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.queue_closed_by_enum AS ENUM (
    'DOCTOR',
    'ADMIN',
    'SYSTEM'
);


ALTER TYPE public.queue_closed_by_enum OWNER TO postgres;

--
-- TOC entry 1134 (class 1247 OID 32829)
-- Name: queue_entry_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.queue_entry_type_enum AS ENUM (
    'APPOINTMENT',
    'WALKIN',
    'TELE',
    'EMERGENCY'
);


ALTER TYPE public.queue_entry_type_enum OWNER TO postgres;

--
-- TOC entry 1140 (class 1247 OID 32858)
-- Name: queue_item_priority_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.queue_item_priority_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'EMERGENCY'
);


ALTER TYPE public.queue_item_priority_enum OWNER TO postgres;

--
-- TOC entry 1137 (class 1247 OID 32838)
-- Name: queue_item_state_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.queue_item_state_enum AS ENUM (
    'BOOKED',
    'ARRIVED',
    'VITALS_DONE',
    'PREPARED',
    'READY_FOR_DOCTOR',
    'IN_CONSULTATION',
    'COMPLETED',
    'NO_SHOW',
    'CANCELLED'
);


ALTER TYPE public.queue_item_state_enum OWNER TO postgres;

--
-- TOC entry 1101 (class 1247 OID 32665)
-- Name: queue_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.queue_status_enum AS ENUM (
    'ACTIVE',
    'PAUSED',
    'CLOSED',
    'CANCELLED'
);


ALTER TYPE public.queue_status_enum OWNER TO postgres;

--
-- TOC entry 1212 (class 1247 OID 33284)
-- Name: referral_urgency_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.referral_urgency_enum AS ENUM (
    'ROUTINE',
    'URGENT',
    'EMERGENCY'
);


ALTER TYPE public.referral_urgency_enum OWNER TO postgres;

--
-- TOC entry 963 (class 1247 OID 29220)
-- Name: report_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.report_type_enum AS ENUM (
    'PRESCRIPTION',
    'LAB_REPORT',
    'VACCINATION_RECORD',
    'DISCHARGE_SUMMARY',
    'IMAGING_SCAN',
    'OTHER'
);


ALTER TYPE public.report_type_enum OWNER TO postgres;

--
-- TOC entry 966 (class 1247 OID 29234)
-- Name: resolved_by_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.resolved_by_enum AS ENUM (
    'PARENT',
    'DOCTOR'
);


ALTER TYPE public.resolved_by_enum OWNER TO postgres;

--
-- TOC entry 969 (class 1247 OID 29240)
-- Name: specialization_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.specialization_enum AS ENUM (
    'PEDIATRICS',
    'NEONATOLOGY',
    'PEDIATRIC_NUTRITION',
    'PEDIATRIC_ENDOCRINOLOGY',
    'PEDIATRIC_NEUROLOGY',
    'PEDIATRIC_CARDIOLOGY',
    'PEDIATRIC_PULMONOLOGY',
    'PEDIATRIC_GASTROENTEROLOGY',
    'PEDIATRIC_NEPHROLOGY',
    'PEDIATRIC_INFECTIOUS_DISEASES',
    'PEDIATRIC_HEMATOLOGY_ONCOLOGY',
    'DEVELOPMENTAL_PEDIATRICS',
    'PEDIATRIC_PSYCHIATRY',
    'PEDIATRIC_ORTHOPEDICS',
    'PEDIATRIC_OPHTHALMOLOGY',
    'PEDIATRIC_DENTISTRY',
    'PEDIATRIC_ENT',
    'SPEECH_AND_LANGUAGE_THERAPY',
    'PHYSIOTHERAPY_OCCUPATIONAL_THERAPY',
    'PUBLIC_HEALTH_COMMUNITY_PEDIATRICS'
);


ALTER TYPE public.specialization_enum OWNER TO postgres;

--
-- TOC entry 1149 (class 1247 OID 32914)
-- Name: staff_availability_day_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.staff_availability_day_enum AS ENUM (
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
    'SUN'
);


ALTER TYPE public.staff_availability_day_enum OWNER TO postgres;

--
-- TOC entry 1110 (class 1247 OID 32702)
-- Name: staff_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.staff_role_enum AS ENUM (
    'NURSE',
    'RECEPTIONIST',
    'HELPER'
);


ALTER TYPE public.staff_role_enum OWNER TO postgres;

--
-- TOC entry 1221 (class 1247 OID 33326)
-- Name: symptom_recorded_by_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.symptom_recorded_by_type_enum AS ENUM (
    'PARENT',
    'DOCTOR'
);


ALTER TYPE public.symptom_recorded_by_type_enum OWNER TO postgres;

--
-- TOC entry 1218 (class 1247 OID 33319)
-- Name: symptom_severity_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.symptom_severity_enum AS ENUM (
    'MILD',
    'MODERATE',
    'SEVERE'
);


ALTER TYPE public.symptom_severity_enum OWNER TO postgres;

--
-- TOC entry 972 (class 1247 OID 29282)
-- Name: vaccination_age_group_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vaccination_age_group_enum AS ENUM (
    'INFANT',
    'TODDLER',
    'PRESCHOOL',
    'SCHOOL_AGE'
);


ALTER TYPE public.vaccination_age_group_enum OWNER TO postgres;

--
-- TOC entry 975 (class 1247 OID 29292)
-- Name: vaccine_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vaccine_category_enum AS ENUM (
    'CORE',
    'OPTIONAL',
    'REGIONAL',
    'SUPPLEMENTAL'
);


ALTER TYPE public.vaccine_category_enum OWNER TO postgres;

--
-- TOC entry 1269 (class 1247 OID 33537)
-- Name: vaccine_route_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vaccine_route_enum AS ENUM (
    'IM',
    'SC',
    'ORAL',
    'INTRADERMAL'
);


ALTER TYPE public.vaccine_route_enum OWNER TO postgres;

--
-- TOC entry 978 (class 1247 OID 29302)
-- Name: vaccine_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.vaccine_status_enum AS ENUM (
    'PENDING',
    'COMPLETED',
    'MISSED'
);


ALTER TYPE public.vaccine_status_enum OWNER TO postgres;

--
-- TOC entry 1170 (class 1247 OID 33028)
-- Name: visit_advice_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_advice_category_enum AS ENUM (
    'GENERAL',
    'NUTRITION',
    'MEDICATION',
    'LIFESTYLE',
    'WARNING_SIGNS',
    'OTHER'
);


ALTER TYPE public.visit_advice_category_enum OWNER TO postgres;

--
-- TOC entry 1185 (class 1247 OID 33130)
-- Name: visit_doctor_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_doctor_role_enum AS ENUM (
    'PRIMARY',
    'SECONDARY',
    'REVIEW'
);


ALTER TYPE public.visit_doctor_role_enum OWNER TO postgres;

--
-- TOC entry 1191 (class 1247 OID 33165)
-- Name: visit_document_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_document_type_enum AS ENUM (
    'PRESCRIPTION',
    'REPORT',
    'IMAGE',
    'EXTERNAL_DOCUMENT',
    'OTHER'
);


ALTER TYPE public.visit_document_type_enum OWNER TO postgres;

--
-- TOC entry 1194 (class 1247 OID 33176)
-- Name: visit_document_uploaded_by_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_document_uploaded_by_enum AS ENUM (
    'DOCTOR',
    'STAFF',
    'PARENT'
);


ALTER TYPE public.visit_document_uploaded_by_enum OWNER TO postgres;

--
-- TOC entry 1200 (class 1247 OID 33209)
-- Name: visit_followup_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_followup_type_enum AS ENUM (
    'ROUTINE',
    'REVIEW',
    'URGENT',
    'TELE'
);


ALTER TYPE public.visit_followup_type_enum OWNER TO postgres;

--
-- TOC entry 1164 (class 1247 OID 32982)
-- Name: visit_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_status_enum AS ENUM (
    'CREATED',
    'IN_CONSULTATION',
    'COMPLETED',
    'ABANDONED'
);


ALTER TYPE public.visit_status_enum OWNER TO postgres;

--
-- TOC entry 1161 (class 1247 OID 32973)
-- Name: visit_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_type_enum AS ENUM (
    'WALKIN',
    'APPOINTMENT',
    'TELE',
    'EMERGENCY'
);


ALTER TYPE public.visit_type_enum OWNER TO postgres;

--
-- TOC entry 1227 (class 1247 OID 33351)
-- Name: visit_vitals_entered_by_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.visit_vitals_entered_by_enum AS ENUM (
    'DOCTOR',
    'STAFF',
    'DEVICE'
);


ALTER TYPE public.visit_vitals_entered_by_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 314 (class 1259 OID 33594)
-- Name: addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addresses (
    id integer NOT NULL,
    line1 character varying(255) NOT NULL,
    line2 character varying(255),
    area_locality character varying(255),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    pincode character varying(10) NOT NULL,
    country character varying(100) DEFAULT 'India'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.addresses OWNER TO postgres;

--
-- TOC entry 313 (class 1259 OID 33593)
-- Name: addresses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.addresses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.addresses_id_seq OWNER TO postgres;

--
-- TOC entry 5965 (class 0 OID 0)
-- Dependencies: 313
-- Name: addresses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addresses_id_seq OWNED BY public.addresses.id;


--
-- TOC entry 219 (class 1259 OID 29309)
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 32510)
-- Name: appointments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appointments (
    id integer NOT NULL,
    child_id integer NOT NULL,
    place_id integer NOT NULL,
    doctor_id integer,
    booked_by public.appointment_booked_by_enum NOT NULL,
    booked_by_id integer NOT NULL,
    reason public.appointment_reason_enum,
    appointment_time timestamp without time zone NOT NULL,
    status public.appointment_status_enum DEFAULT 'BOOKED'::public.appointment_status_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.appointments OWNER TO postgres;

--
-- TOC entry 260 (class 1259 OID 32509)
-- Name: appointments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.appointments_id_seq OWNER TO postgres;

--
-- TOC entry 5966 (class 0 OID 0)
-- Dependencies: 260
-- Name: appointments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;


--
-- TOC entry 220 (class 1259 OID 29313)
-- Name: child_anthropometry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_anthropometry (
    id integer NOT NULL,
    child_id integer NOT NULL,
    log_date date NOT NULL,
    height_cm double precision,
    weight_kg double precision,
    muac_cm double precision,
    avg_sleep_hours_per_day double precision,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.child_anthropometry OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 29323)
-- Name: child_anthropometry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_anthropometry_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_anthropometry_id_seq OWNER TO postgres;

--
-- TOC entry 5967 (class 0 OID 0)
-- Dependencies: 221
-- Name: child_anthropometry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_anthropometry_id_seq OWNED BY public.child_anthropometry.id;


--
-- TOC entry 222 (class 1259 OID 29324)
-- Name: child_illness_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_illness_logs (
    id integer NOT NULL,
    child_id integer NOT NULL,
    fever boolean DEFAULT false NOT NULL,
    cold boolean DEFAULT false NOT NULL,
    cough boolean DEFAULT false NOT NULL,
    sore_throat boolean DEFAULT false NOT NULL,
    headache boolean DEFAULT false NOT NULL,
    stomach_ache boolean DEFAULT false NOT NULL,
    nausea boolean DEFAULT false NOT NULL,
    vomiting boolean DEFAULT false NOT NULL,
    diarrhea boolean DEFAULT false NOT NULL,
    rash boolean DEFAULT false NOT NULL,
    fatigue boolean DEFAULT false NOT NULL,
    loss_of_appetite boolean DEFAULT false NOT NULL,
    temperature_c double precision,
    temperature_time timestamp without time zone,
    symptom_start_date timestamp without time zone,
    severity public.illness_severity_enum,
    is_current boolean DEFAULT true NOT NULL,
    resolved_on timestamp without time zone,
    resolved_by public.resolved_by_enum,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.child_illness_logs OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 29361)
-- Name: child_illness_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_illness_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_illness_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5968 (class 0 OID 0)
-- Dependencies: 223
-- Name: child_illness_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_illness_logs_id_seq OWNED BY public.child_illness_logs.id;


--
-- TOC entry 224 (class 1259 OID 29362)
-- Name: child_meal_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_meal_item (
    id integer NOT NULL,
    meal_log_id integer NOT NULL,
    meal_type public.meal_type_enum NOT NULL,
    food_id integer,
    custom_food_name character varying(100),
    serving_size_g double precision NOT NULL,
    is_ai_estimated boolean DEFAULT false NOT NULL,
    energy_kcal double precision,
    protein_g double precision,
    carb_g double precision,
    fat_g double precision,
    iron_mg double precision,
    calcium_mg double precision,
    vitamin_a_mcg double precision,
    vitamin_c_mg double precision,
    meal_frequency integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.child_meal_item OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 29373)
-- Name: child_meal_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_meal_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_meal_item_id_seq OWNER TO postgres;

--
-- TOC entry 5969 (class 0 OID 0)
-- Dependencies: 225
-- Name: child_meal_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_meal_item_id_seq OWNED BY public.child_meal_item.id;


--
-- TOC entry 226 (class 1259 OID 29374)
-- Name: child_meal_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_meal_log (
    id integer NOT NULL,
    child_id integer NOT NULL,
    log_date date NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.child_meal_log OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 29384)
-- Name: child_meal_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_meal_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_meal_log_id_seq OWNER TO postgres;

--
-- TOC entry 5970 (class 0 OID 0)
-- Dependencies: 227
-- Name: child_meal_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_meal_log_id_seq OWNED BY public.child_meal_log.id;


--
-- TOC entry 228 (class 1259 OID 29385)
-- Name: child_medical_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_medical_reports (
    report_id integer NOT NULL,
    child_id integer NOT NULL,
    report_type public.report_type_enum NOT NULL,
    title character varying(200),
    description text,
    mime_type character varying(100) NOT NULL,
    file_size integer NOT NULL,
    storage_path character varying(255) NOT NULL,
    encrypted_dek text NOT NULL,
    dek_nonce character varying(64) NOT NULL,
    file_nonce character varying(64) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.child_medical_reports OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 29403)
-- Name: child_medical_reports_report_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_medical_reports_report_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_medical_reports_report_id_seq OWNER TO postgres;

--
-- TOC entry 5971 (class 0 OID 0)
-- Dependencies: 229
-- Name: child_medical_reports_report_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_medical_reports_report_id_seq OWNED BY public.child_medical_reports.report_id;


--
-- TOC entry 230 (class 1259 OID 29404)
-- Name: child_milestone_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_milestone_status (
    id integer NOT NULL,
    child_id integer NOT NULL,
    milestone_id integer NOT NULL,
    achieved_date date,
    difficulty public.achieved_difficulty_enum,
    special_milestone boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.child_milestone_status OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 29416)
-- Name: child_milestone_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_milestone_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_milestone_status_id_seq OWNER TO postgres;

--
-- TOC entry 5972 (class 0 OID 0)
-- Dependencies: 231
-- Name: child_milestone_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_milestone_status_id_seq OWNED BY public.child_milestone_status.id;


--
-- TOC entry 232 (class 1259 OID 29417)
-- Name: child_milestones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_milestones (
    id integer NOT NULL,
    category public.vaccination_age_group_enum NOT NULL,
    milestone_code character varying(100) NOT NULL,
    milestone_name character varying(150) NOT NULL,
    sub_feature_1 character varying(150),
    sub_feature_2 character varying(150),
    sub_feature_3 character varying(150),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.child_milestones OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 29430)
-- Name: child_milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_milestones_id_seq OWNER TO postgres;

--
-- TOC entry 5973 (class 0 OID 0)
-- Dependencies: 233
-- Name: child_milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_milestones_id_seq OWNED BY public.child_milestones.id;


--
-- TOC entry 234 (class 1259 OID 29431)
-- Name: child_prediction_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_prediction_reports (
    id integer NOT NULL,
    child_id integer NOT NULL,
    age_group public.vaccination_age_group_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_existing integer,
    age_days integer,
    age_months integer,
    age_years integer,
    sex integer,
    weight_kg double precision,
    height_cm double precision,
    muac_cm double precision,
    bmi double precision,
    weight_zscore double precision,
    height_zscore double precision,
    feeding_type integer,
    feeding_frequency integer,
    vaccination_status integer,
    sleep_hours double precision,
    illness_fever integer,
    illness_cold integer,
    illness_diarrhea integer,
    milestone_smile integer,
    milestone_roll integer,
    milestone_sit integer,
    milestones_language integer,
    milestones_walking integer,
    milestone_speech_clarity integer,
    milestone_social_play integer,
    milestone_learning_skill integer,
    milestone_social_skill integer,
    avg_weight_gain double precision,
    weight_velocity double precision,
    illness_freq_trend double precision,
    growth_percentile double precision,
    nutrition_flag integer,
    prob_fever double precision,
    prob_cold double precision,
    prob_diarrhea double precision,
    milestone_sit_delay_prob double precision,
    milestones_language_delay_prob double precision,
    milestones_walking_delay_prob double precision,
    milestone_speech_delay_prob double precision,
    milestone_social_play_delay_prob double precision,
    milestone_learning_delay_prob double precision,
    milestone_social_skill_delay_prob double precision
);


ALTER TABLE public.child_prediction_reports OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 29439)
-- Name: child_prediction_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_prediction_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_prediction_reports_id_seq OWNER TO postgres;

--
-- TOC entry 5974 (class 0 OID 0)
-- Dependencies: 235
-- Name: child_prediction_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_prediction_reports_id_seq OWNED BY public.child_prediction_reports.id;


--
-- TOC entry 318 (class 1259 OID 33643)
-- Name: child_profile_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_profile_photos (
    id integer NOT NULL,
    child_id integer NOT NULL,
    photo_url character varying(255) NOT NULL,
    mime_type character varying(100),
    file_size integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.child_profile_photos OWNER TO postgres;

--
-- TOC entry 317 (class 1259 OID 33642)
-- Name: child_profile_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_profile_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_profile_photos_id_seq OWNER TO postgres;

--
-- TOC entry 5975 (class 0 OID 0)
-- Dependencies: 317
-- Name: child_profile_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_profile_photos_id_seq OWNED BY public.child_profile_photos.id;


--
-- TOC entry 236 (class 1259 OID 29440)
-- Name: child_vaccine_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.child_vaccine_status (
    id integer NOT NULL,
    child_id integer NOT NULL,
    schedule_id integer NOT NULL,
    dose_number integer NOT NULL,
    status public.vaccine_status_enum NOT NULL,
    scheduled_text character varying(100),
    scheduled_date date,
    actual_date date,
    notes character varying(250),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    side_effects text
);


ALTER TABLE public.child_vaccine_status OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 29454)
-- Name: child_vaccine_status_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.child_vaccine_status_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.child_vaccine_status_id_seq OWNER TO postgres;

--
-- TOC entry 5976 (class 0 OID 0)
-- Dependencies: 237
-- Name: child_vaccine_status_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.child_vaccine_status_id_seq OWNED BY public.child_vaccine_status.id;


--
-- TOC entry 238 (class 1259 OID 29455)
-- Name: children; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.children (
    child_id integer NOT NULL,
    parent_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    gender character varying(20),
    blood_group character varying(5),
    date_of_birth date NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.children OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 29466)
-- Name: children_child_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.children_child_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.children_child_id_seq OWNER TO postgres;

--
-- TOC entry 5977 (class 0 OID 0)
-- Dependencies: 239
-- Name: children_child_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.children_child_id_seq OWNED BY public.children.child_id;


--
-- TOC entry 263 (class 1259 OID 32556)
-- Name: custom_doctor_drug_salts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_doctor_drug_salts (
    id integer NOT NULL,
    custom_drug_id integer NOT NULL,
    salt_name character varying(150) NOT NULL,
    strength_value double precision NOT NULL,
    strength_unit public.custom_drug_strength_unit_enum NOT NULL
);


ALTER TABLE public.custom_doctor_drug_salts OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 32555)
-- Name: custom_doctor_drug_salts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.custom_doctor_drug_salts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_doctor_drug_salts_id_seq OWNER TO postgres;

--
-- TOC entry 5978 (class 0 OID 0)
-- Dependencies: 262
-- Name: custom_doctor_drug_salts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.custom_doctor_drug_salts_id_seq OWNED BY public.custom_doctor_drug_salts.id;


--
-- TOC entry 253 (class 1259 OID 32336)
-- Name: custom_doctor_drugs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_doctor_drugs (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    brand_name character varying(200) NOT NULL,
    generic_name character varying(200) NOT NULL,
    dosage_form public.custom_drug_dosage_form_enum NOT NULL,
    manufacturer character varying(200),
    is_combo boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.custom_doctor_drugs OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 32335)
-- Name: custom_doctor_drugs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.custom_doctor_drugs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.custom_doctor_drugs_id_seq OWNER TO postgres;

--
-- TOC entry 5979 (class 0 OID 0)
-- Dependencies: 252
-- Name: custom_doctor_drugs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.custom_doctor_drugs_id_seq OWNED BY public.custom_doctor_drugs.id;


--
-- TOC entry 254 (class 1259 OID 32359)
-- Name: doctor_auth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_auth (
    doctor_id integer NOT NULL,
    password_hash text NOT NULL,
    last_login timestamp without time zone
);


ALTER TABLE public.doctor_auth OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 32590)
-- Name: doctor_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_availability (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    place_id integer NOT NULL,
    day_of_week public.doctor_availability_day_enum NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.doctor_availability OWNER TO postgres;

--
-- TOC entry 264 (class 1259 OID 32589)
-- Name: doctor_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_availability_id_seq OWNER TO postgres;

--
-- TOC entry 5980 (class 0 OID 0)
-- Dependencies: 264
-- Name: doctor_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_availability_id_seq OWNED BY public.doctor_availability.id;


--
-- TOC entry 273 (class 1259 OID 32764)
-- Name: doctor_place_role_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_place_role_documents (
    id integer NOT NULL,
    doctor_place_role_id integer NOT NULL,
    document_type public.doctor_place_role_document_type_enum NOT NULL,
    document_name character varying(200) NOT NULL,
    document_url text NOT NULL,
    status public.doctor_place_role_document_status_enum DEFAULT 'PENDING'::public.doctor_place_role_document_status_enum NOT NULL,
    reviewed_by_type public.doctor_place_role_document_reviewed_by_type_enum,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    review_notes character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.doctor_place_role_documents OWNER TO postgres;

--
-- TOC entry 272 (class 1259 OID 32763)
-- Name: doctor_place_role_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_place_role_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_place_role_documents_id_seq OWNER TO postgres;

--
-- TOC entry 5981 (class 0 OID 0)
-- Dependencies: 272
-- Name: doctor_place_role_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_place_role_documents_id_seq OWNED BY public.doctor_place_role_documents.id;


--
-- TOC entry 267 (class 1259 OID 32636)
-- Name: doctor_place_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_place_roles (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    place_id integer NOT NULL,
    role public.doctor_place_role_enum NOT NULL,
    status public.doctor_place_role_status_enum DEFAULT 'PENDING'::public.doctor_place_role_status_enum NOT NULL,
    changed_by integer,
    changed_at timestamp without time zone,
    approved_by_type public.admin_owner_enum,
    joined_at timestamp without time zone,
    suspended_reason character varying(255)
);


ALTER TABLE public.doctor_place_roles OWNER TO postgres;

--
-- TOC entry 266 (class 1259 OID 32635)
-- Name: doctor_place_roles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_place_roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_place_roles_id_seq OWNER TO postgres;

--
-- TOC entry 5982 (class 0 OID 0)
-- Dependencies: 266
-- Name: doctor_place_roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_place_roles_id_seq OWNED BY public.doctor_place_roles.id;


--
-- TOC entry 255 (class 1259 OID 32385)
-- Name: doctor_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_status (
    doctor_id integer NOT NULL,
    status public.doctor_status_enum DEFAULT 'INACTIVE'::public.doctor_status_enum NOT NULL,
    reason character varying(255),
    set_by public.doctor_status_set_by_enum NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.doctor_status OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 32420)
-- Name: doctor_verification_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctor_verification_documents (
    id integer NOT NULL,
    doctor_id integer NOT NULL,
    document_type public.doctor_verification_document_type_enum NOT NULL,
    document_name character varying(200) NOT NULL,
    document_url text NOT NULL,
    status public.doctor_verification_document_status_enum DEFAULT 'PENDING'::public.doctor_verification_document_status_enum NOT NULL,
    reviewed_by integer,
    reviewed_at timestamp without time zone,
    review_notes character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.doctor_verification_documents OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 32419)
-- Name: doctor_verification_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctor_verification_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctor_verification_documents_id_seq OWNER TO postgres;

--
-- TOC entry 5983 (class 0 OID 0)
-- Dependencies: 256
-- Name: doctor_verification_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctor_verification_documents_id_seq OWNED BY public.doctor_verification_documents.id;


--
-- TOC entry 240 (class 1259 OID 29467)
-- Name: doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.doctors (
    doctor_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone_number character varying(15) NOT NULL,
    specialization public.specialization_enum,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    registration_number character varying(100) NOT NULL,
    registration_council character varying(150) NOT NULL,
    experience_years integer NOT NULL,
    qualifications character varying(255) NOT NULL,
    is_verified boolean DEFAULT false NOT NULL
);


ALTER TABLE public.doctors OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 29481)
-- Name: doctors_doctor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.doctors_doctor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.doctors_doctor_id_seq OWNER TO postgres;

--
-- TOC entry 5984 (class 0 OID 0)
-- Dependencies: 241
-- Name: doctors_doctor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.doctors_doctor_id_seq OWNED BY public.doctors.doctor_id;


--
-- TOC entry 242 (class 1259 OID 29482)
-- Name: food_master; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.food_master (
    food_id integer NOT NULL,
    food_name character varying(100) NOT NULL,
    category_age_group public.food_age_group_enum NOT NULL,
    food_group character varying(30),
    avg_serving_g double precision,
    energy_kcal double precision,
    protein_g double precision,
    carb_g double precision,
    fat_g double precision,
    iron_mg double precision,
    calcium_mg double precision,
    vitamin_a_mcg double precision,
    vitamin_c_mg double precision,
    is_veg boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.food_master OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 29494)
-- Name: food_master_food_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.food_master_food_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.food_master_food_id_seq OWNER TO postgres;

--
-- TOC entry 5985 (class 0 OID 0)
-- Dependencies: 243
-- Name: food_master_food_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.food_master_food_id_seq OWNED BY public.food_master.food_id;


--
-- TOC entry 244 (class 1259 OID 29495)
-- Name: nutrition_recipe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nutrition_recipe (
    id integer NOT NULL,
    age_min_months integer NOT NULL,
    age_max_months integer NOT NULL,
    recipe_code character varying(100) NOT NULL,
    recipe_name character varying(200) NOT NULL,
    veg_nonveg character varying(20),
    primary_nutrient character varying(50),
    secondary_nutrients text,
    energy_density character varying(30),
    meal_type character varying(50),
    texture character varying(50),
    ingredients text,
    instructions text,
    prep_time_mins integer,
    youtube_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.nutrition_recipe OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 29509)
-- Name: nutrition_recipe_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nutrition_recipe_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nutrition_recipe_id_seq OWNER TO postgres;

--
-- TOC entry 5986 (class 0 OID 0)
-- Dependencies: 245
-- Name: nutrition_recipe_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nutrition_recipe_id_seq OWNED BY public.nutrition_recipe.id;


--
-- TOC entry 246 (class 1259 OID 29510)
-- Name: nutrition_requirement; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.nutrition_requirement (
    id integer NOT NULL,
    age_min_months integer NOT NULL,
    age_max_months integer NOT NULL,
    energy_kcal double precision NOT NULL,
    protein_g double precision NOT NULL,
    carb_g double precision NOT NULL,
    fat_g double precision NOT NULL,
    iron_mg double precision NOT NULL,
    calcium_mg double precision NOT NULL,
    vitamin_a_mcg double precision NOT NULL,
    vitamin_c_mg double precision NOT NULL
);


ALTER TABLE public.nutrition_requirement OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 29524)
-- Name: nutrition_requirement_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.nutrition_requirement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.nutrition_requirement_id_seq OWNER TO postgres;

--
-- TOC entry 5987 (class 0 OID 0)
-- Dependencies: 247
-- Name: nutrition_requirement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.nutrition_requirement_id_seq OWNED BY public.nutrition_requirement.id;


--
-- TOC entry 316 (class 1259 OID 33620)
-- Name: parent_profile_photos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parent_profile_photos (
    id integer NOT NULL,
    parent_id integer NOT NULL,
    photo_url character varying(255) NOT NULL,
    mime_type character varying(100),
    file_size integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.parent_profile_photos OWNER TO postgres;

--
-- TOC entry 315 (class 1259 OID 33619)
-- Name: parent_profile_photos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parent_profile_photos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parent_profile_photos_id_seq OWNER TO postgres;

--
-- TOC entry 5988 (class 0 OID 0)
-- Dependencies: 315
-- Name: parent_profile_photos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parent_profile_photos_id_seq OWNED BY public.parent_profile_photos.id;


--
-- TOC entry 248 (class 1259 OID 29525)
-- Name: parents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parents (
    parent_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    phone_number character varying(15) NOT NULL,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.parents OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 29541)
-- Name: parents_parent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.parents_parent_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parents_parent_id_seq OWNER TO postgres;

--
-- TOC entry 5989 (class 0 OID 0)
-- Dependencies: 249
-- Name: parents_parent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.parents_parent_id_seq OWNED BY public.parents.parent_id;


--
-- TOC entry 259 (class 1259 OID 32452)
-- Name: places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.places (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    type public.place_type_enum NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_by_doctor integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    address_id integer,
    official_phone character varying(20)
);


ALTER TABLE public.places OWNER TO postgres;

--
-- TOC entry 258 (class 1259 OID 32451)
-- Name: places_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.places_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.places_id_seq OWNER TO postgres;

--
-- TOC entry 5990 (class 0 OID 0)
-- Dependencies: 258
-- Name: places_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.places_id_seq OWNED BY public.places.id;


--
-- TOC entry 275 (class 1259 OID 32794)
-- Name: queue_access_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_access_assignments (
    id integer NOT NULL,
    place_id integer NOT NULL,
    queue_id integer NOT NULL,
    actor_type public.queue_access_actor_type_enum NOT NULL,
    actor_id integer NOT NULL,
    access_date date NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    can_work boolean DEFAULT true NOT NULL,
    assigned_by integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.queue_access_assignments OWNER TO postgres;

--
-- TOC entry 274 (class 1259 OID 32793)
-- Name: queue_access_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.queue_access_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.queue_access_assignments_id_seq OWNER TO postgres;

--
-- TOC entry 5991 (class 0 OID 0)
-- Dependencies: 274
-- Name: queue_access_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.queue_access_assignments_id_seq OWNED BY public.queue_access_assignments.id;


--
-- TOC entry 282 (class 1259 OID 32954)
-- Name: queue_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_assignments (
    id integer NOT NULL,
    queue_item_id integer NOT NULL,
    assigned_to_type public.queue_assignment_actor_type_enum NOT NULL,
    assigned_to_id integer NOT NULL,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL,
    released_at timestamp without time zone
);


ALTER TABLE public.queue_assignments OWNER TO postgres;

--
-- TOC entry 281 (class 1259 OID 32953)
-- Name: queue_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.queue_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.queue_assignments_id_seq OWNER TO postgres;

--
-- TOC entry 5992 (class 0 OID 0)
-- Dependencies: 281
-- Name: queue_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.queue_assignments_id_seq OWNED BY public.queue_assignments.id;


--
-- TOC entry 277 (class 1259 OID 32868)
-- Name: queue_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queue_items (
    id integer NOT NULL,
    queue_id integer NOT NULL,
    child_id integer NOT NULL,
    entry_type public.queue_entry_type_enum NOT NULL,
    state public.queue_item_state_enum NOT NULL,
    priority public.queue_item_priority_enum DEFAULT 'LOW'::public.queue_item_priority_enum NOT NULL,
    appointment_time timestamp without time zone,
    checked_in_at timestamp without time zone,
    appointment_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.queue_items OWNER TO postgres;

--
-- TOC entry 276 (class 1259 OID 32867)
-- Name: queue_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.queue_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.queue_items_id_seq OWNER TO postgres;

--
-- TOC entry 5993 (class 0 OID 0)
-- Dependencies: 276
-- Name: queue_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.queue_items_id_seq OWNED BY public.queue_items.id;


--
-- TOC entry 269 (class 1259 OID 32682)
-- Name: queues; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.queues (
    id integer NOT NULL,
    place_id integer NOT NULL,
    queue_date date NOT NULL,
    status public.queue_status_enum DEFAULT 'ACTIVE'::public.queue_status_enum NOT NULL,
    closed_reason character varying(255),
    closed_by public.queue_closed_by_enum,
    closed_at timestamp without time zone
);


ALTER TABLE public.queues OWNER TO postgres;

--
-- TOC entry 268 (class 1259 OID 32681)
-- Name: queues_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.queues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.queues_id_seq OWNER TO postgres;

--
-- TOC entry 5994 (class 0 OID 0)
-- Dependencies: 268
-- Name: queues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.queues_id_seq OWNED BY public.queues.id;


--
-- TOC entry 271 (class 1259 OID 32710)
-- Name: staff; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    place_id integer NOT NULL,
    full_name character varying(150),
    role public.staff_role_enum NOT NULL,
    phone character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_by_doctor integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.staff OWNER TO postgres;

--
-- TOC entry 278 (class 1259 OID 32899)
-- Name: staff_auth; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_auth (
    staff_id integer NOT NULL,
    password_hash text
);


ALTER TABLE public.staff_auth OWNER TO postgres;

--
-- TOC entry 280 (class 1259 OID 32930)
-- Name: staff_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staff_availability (
    id integer NOT NULL,
    staff_id integer NOT NULL,
    day_of_week public.staff_availability_day_enum NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    is_active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.staff_availability OWNER TO postgres;

--
-- TOC entry 279 (class 1259 OID 32929)
-- Name: staff_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_availability_id_seq OWNER TO postgres;

--
-- TOC entry 5995 (class 0 OID 0)
-- Dependencies: 279
-- Name: staff_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_availability_id_seq OWNED BY public.staff_availability.id;


--
-- TOC entry 270 (class 1259 OID 32709)
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_id_seq OWNER TO postgres;

--
-- TOC entry 5996 (class 0 OID 0)
-- Dependencies: 270
-- Name: staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;


--
-- TOC entry 250 (class 1259 OID 29542)
-- Name: vaccination_schedule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vaccination_schedule (
    id integer NOT NULL,
    vaccine_name character varying(100) NOT NULL,
    disease_prevented character varying(200) NOT NULL,
    recommended_age character varying(100) NOT NULL,
    doses_required integer NOT NULL,
    category public.vaccine_category_enum NOT NULL,
    age_group public.vaccination_age_group_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vaccination_schedule OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 29556)
-- Name: vaccination_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vaccination_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vaccination_schedule_id_seq OWNER TO postgres;

--
-- TOC entry 5997 (class 0 OID 0)
-- Dependencies: 251
-- Name: vaccination_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vaccination_schedule_id_seq OWNED BY public.vaccination_schedule.id;


--
-- TOC entry 286 (class 1259 OID 33042)
-- Name: visit_advice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_advice (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    doctor_id integer NOT NULL,
    advice_text text NOT NULL,
    advice_category public.visit_advice_category_enum DEFAULT 'GENERAL'::public.visit_advice_category_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visit_advice OWNER TO postgres;

--
-- TOC entry 285 (class 1259 OID 33041)
-- Name: visit_advice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_advice_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_advice_id_seq OWNER TO postgres;

--
-- TOC entry 5998 (class 0 OID 0)
-- Dependencies: 285
-- Name: visit_advice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_advice_id_seq OWNED BY public.visit_advice.id;


--
-- TOC entry 287 (class 1259 OID 33069)
-- Name: visit_clinical_summary; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_clinical_summary (
    visit_id integer NOT NULL,
    has_vitals boolean DEFAULT false NOT NULL,
    has_symptoms boolean DEFAULT false NOT NULL,
    has_diagnosis boolean DEFAULT false NOT NULL,
    has_prescription boolean DEFAULT false NOT NULL,
    has_advice boolean DEFAULT false NOT NULL,
    has_followup boolean DEFAULT false NOT NULL,
    has_referral boolean DEFAULT false NOT NULL,
    has_documents boolean DEFAULT false NOT NULL
);


ALTER TABLE public.visit_clinical_summary OWNER TO postgres;

--
-- TOC entry 289 (class 1259 OID 33104)
-- Name: visit_diagnoses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_diagnoses (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    doctor_id integer NOT NULL,
    diagnosis_text character varying(255) NOT NULL,
    diagnosis_code character varying(50),
    diagnosis_type public.diagnosis_type_enum DEFAULT 'PRIMARY'::public.diagnosis_type_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visit_diagnoses OWNER TO postgres;

--
-- TOC entry 288 (class 1259 OID 33103)
-- Name: visit_diagnoses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_diagnoses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_diagnoses_id_seq OWNER TO postgres;

--
-- TOC entry 5999 (class 0 OID 0)
-- Dependencies: 288
-- Name: visit_diagnoses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_diagnoses_id_seq OWNED BY public.visit_diagnoses.id;


--
-- TOC entry 291 (class 1259 OID 33138)
-- Name: visit_doctors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_doctors (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    doctor_id integer NOT NULL,
    role public.visit_doctor_role_enum DEFAULT 'PRIMARY'::public.visit_doctor_role_enum NOT NULL,
    assigned_at timestamp without time zone DEFAULT now() NOT NULL,
    released_at timestamp without time zone
);


ALTER TABLE public.visit_doctors OWNER TO postgres;

--
-- TOC entry 290 (class 1259 OID 33137)
-- Name: visit_doctors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_doctors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_doctors_id_seq OWNER TO postgres;

--
-- TOC entry 6000 (class 0 OID 0)
-- Dependencies: 290
-- Name: visit_doctors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_doctors_id_seq OWNED BY public.visit_doctors.id;


--
-- TOC entry 293 (class 1259 OID 33184)
-- Name: visit_documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_documents (
    id integer NOT NULL,
    visit_id integer,
    child_id integer NOT NULL,
    document_type public.visit_document_type_enum,
    file_name character varying(255),
    file_url text,
    mime_type character varying(50),
    uploaded_by_type public.visit_document_uploaded_by_enum NOT NULL,
    uploaded_by_id integer,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visit_documents OWNER TO postgres;

--
-- TOC entry 292 (class 1259 OID 33183)
-- Name: visit_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_documents_id_seq OWNER TO postgres;

--
-- TOC entry 6001 (class 0 OID 0)
-- Dependencies: 292
-- Name: visit_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_documents_id_seq OWNED BY public.visit_documents.id;


--
-- TOC entry 295 (class 1259 OID 33218)
-- Name: visit_followups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_followups (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    doctor_id integer NOT NULL,
    follow_up_required boolean DEFAULT false NOT NULL,
    follow_up_type public.visit_followup_type_enum,
    follow_up_date date,
    follow_up_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visit_followups OWNER TO postgres;

--
-- TOC entry 294 (class 1259 OID 33217)
-- Name: visit_followups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_followups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_followups_id_seq OWNER TO postgres;

--
-- TOC entry 6002 (class 0 OID 0)
-- Dependencies: 294
-- Name: visit_followups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_followups_id_seq OWNED BY public.visit_followups.id;


--
-- TOC entry 305 (class 1259 OID 33410)
-- Name: visit_injections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_injections (
    id integer NOT NULL,
    prescription_item_id integer NOT NULL,
    drug_source public.injection_drug_source_enum NOT NULL,
    medicine_id character varying(36),
    custom_drug_id integer,
    route public.injection_route_enum NOT NULL,
    site character varying(100),
    dose_value double precision,
    dose_unit public.injection_dose_unit_enum,
    administered_by public.injection_administered_by_enum,
    administered_at timestamp without time zone,
    instructions text
);


ALTER TABLE public.visit_injections OWNER TO postgres;

--
-- TOC entry 304 (class 1259 OID 33409)
-- Name: visit_injections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_injections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_injections_id_seq OWNER TO postgres;

--
-- TOC entry 6003 (class 0 OID 0)
-- Dependencies: 304
-- Name: visit_injections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_injections_id_seq OWNED BY public.visit_injections.id;


--
-- TOC entry 312 (class 1259 OID 33565)
-- Name: visit_medicine_timing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_medicine_timing (
    medicine_id integer NOT NULL,
    morning boolean DEFAULT false NOT NULL,
    afternoon boolean DEFAULT false NOT NULL,
    evening boolean DEFAULT false NOT NULL,
    night boolean DEFAULT false NOT NULL,
    dose_quantity double precision NOT NULL
);


ALTER TABLE public.visit_medicine_timing OWNER TO postgres;

--
-- TOC entry 307 (class 1259 OID 33478)
-- Name: visit_medicines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_medicines (
    id integer NOT NULL,
    prescription_item_id integer NOT NULL,
    drug_source public.medicine_drug_source_enum NOT NULL,
    medicine_id character varying(36),
    custom_drug_id integer,
    dosage_form public.medicine_dosage_form_enum NOT NULL,
    route public.medicine_route_enum NOT NULL,
    duration_days integer NOT NULL,
    meal_relation public.medicine_meal_relation_enum DEFAULT 'AFTER_MEAL'::public.medicine_meal_relation_enum NOT NULL,
    is_prn boolean DEFAULT false NOT NULL,
    instructions text
);


ALTER TABLE public.visit_medicines OWNER TO postgres;

--
-- TOC entry 306 (class 1259 OID 33477)
-- Name: visit_medicines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_medicines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_medicines_id_seq OWNER TO postgres;

--
-- TOC entry 6004 (class 0 OID 0)
-- Dependencies: 306
-- Name: visit_medicines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_medicines_id_seq OWNED BY public.visit_medicines.id;


--
-- TOC entry 297 (class 1259 OID 33258)
-- Name: visit_prescription_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_prescription_items (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    doctor_id integer NOT NULL,
    item_type public.prescription_item_type_enum NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visit_prescription_items OWNER TO postgres;

--
-- TOC entry 296 (class 1259 OID 33257)
-- Name: visit_prescription_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_prescription_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_prescription_items_id_seq OWNER TO postgres;

--
-- TOC entry 6005 (class 0 OID 0)
-- Dependencies: 296
-- Name: visit_prescription_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_prescription_items_id_seq OWNED BY public.visit_prescription_items.id;


--
-- TOC entry 309 (class 1259 OID 33518)
-- Name: visit_procedures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_procedures (
    id integer NOT NULL,
    prescription_item_id integer NOT NULL,
    procedure_name character varying(200) NOT NULL,
    procedure_type public.procedure_type_enum NOT NULL,
    frequency_per_day integer,
    duration_days integer,
    instructions text
);


ALTER TABLE public.visit_procedures OWNER TO postgres;

--
-- TOC entry 308 (class 1259 OID 33517)
-- Name: visit_procedures_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_procedures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_procedures_id_seq OWNER TO postgres;

--
-- TOC entry 6006 (class 0 OID 0)
-- Dependencies: 308
-- Name: visit_procedures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_procedures_id_seq OWNED BY public.visit_procedures.id;


--
-- TOC entry 299 (class 1259 OID 33292)
-- Name: visit_referrals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_referrals (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    doctor_id integer NOT NULL,
    referred_to_name character varying(200),
    referred_to_specialization character varying(150),
    referred_to_place character varying(200),
    reason text,
    urgency public.referral_urgency_enum DEFAULT 'ROUTINE'::public.referral_urgency_enum NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visit_referrals OWNER TO postgres;

--
-- TOC entry 298 (class 1259 OID 33291)
-- Name: visit_referrals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_referrals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_referrals_id_seq OWNER TO postgres;

--
-- TOC entry 6007 (class 0 OID 0)
-- Dependencies: 298
-- Name: visit_referrals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_referrals_id_seq OWNED BY public.visit_referrals.id;


--
-- TOC entry 301 (class 1259 OID 33332)
-- Name: visit_symptoms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_symptoms (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    symptom_name character varying(150) NOT NULL,
    duration_days integer,
    severity public.symptom_severity_enum,
    recorded_by_type public.symptom_recorded_by_type_enum NOT NULL,
    recorded_by_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visit_symptoms OWNER TO postgres;

--
-- TOC entry 300 (class 1259 OID 33331)
-- Name: visit_symptoms_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_symptoms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_symptoms_id_seq OWNER TO postgres;

--
-- TOC entry 6008 (class 0 OID 0)
-- Dependencies: 300
-- Name: visit_symptoms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_symptoms_id_seq OWNED BY public.visit_symptoms.id;


--
-- TOC entry 311 (class 1259 OID 33546)
-- Name: visit_vaccines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_vaccines (
    id integer NOT NULL,
    prescription_item_id integer NOT NULL,
    vaccine_name character varying(200) NOT NULL,
    brand_name character varying(200),
    dose_number integer,
    route public.vaccine_route_enum,
    site character varying(100),
    next_due_date date,
    administered_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visit_vaccines OWNER TO postgres;

--
-- TOC entry 310 (class 1259 OID 33545)
-- Name: visit_vaccines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_vaccines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_vaccines_id_seq OWNER TO postgres;

--
-- TOC entry 6009 (class 0 OID 0)
-- Dependencies: 310
-- Name: visit_vaccines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_vaccines_id_seq OWNED BY public.visit_vaccines.id;


--
-- TOC entry 303 (class 1259 OID 33358)
-- Name: visit_vitals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visit_vitals (
    id integer NOT NULL,
    visit_id integer NOT NULL,
    weight_kg double precision,
    height_cm double precision,
    head_circumference_cm double precision,
    muac_cm double precision,
    temperature_c double precision,
    heart_rate integer,
    respiratory_rate integer,
    spo2 integer,
    entered_by_type public.visit_vitals_entered_by_enum NOT NULL,
    entered_by_id integer,
    measured_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visit_vitals OWNER TO postgres;

--
-- TOC entry 302 (class 1259 OID 33357)
-- Name: visit_vitals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visit_vitals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visit_vitals_id_seq OWNER TO postgres;

--
-- TOC entry 6010 (class 0 OID 0)
-- Dependencies: 302
-- Name: visit_vitals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visit_vitals_id_seq OWNED BY public.visit_vitals.id;


--
-- TOC entry 284 (class 1259 OID 32992)
-- Name: visits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.visits (
    id integer NOT NULL,
    child_id integer NOT NULL,
    place_id integer NOT NULL,
    queue_item_id integer,
    appointment_id integer,
    visit_type public.visit_type_enum NOT NULL,
    status public.visit_status_enum DEFAULT 'CREATED'::public.visit_status_enum NOT NULL,
    started_at timestamp without time zone,
    ended_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.visits OWNER TO postgres;

--
-- TOC entry 283 (class 1259 OID 32991)
-- Name: visits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.visits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.visits_id_seq OWNER TO postgres;

--
-- TOC entry 6011 (class 0 OID 0)
-- Dependencies: 283
-- Name: visits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.visits_id_seq OWNED BY public.visits.id;


--
-- TOC entry 5431 (class 2604 OID 33597)
-- Name: addresses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses ALTER COLUMN id SET DEFAULT nextval('public.addresses_id_seq'::regclass);


--
-- TOC entry 5359 (class 2604 OID 32513)
-- Name: appointments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments ALTER COLUMN id SET DEFAULT nextval('public.appointments_id_seq'::regclass);


--
-- TOC entry 5287 (class 2604 OID 29557)
-- Name: child_anthropometry id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_anthropometry ALTER COLUMN id SET DEFAULT nextval('public.child_anthropometry_id_seq'::regclass);


--
-- TOC entry 5290 (class 2604 OID 29558)
-- Name: child_illness_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_illness_logs ALTER COLUMN id SET DEFAULT nextval('public.child_illness_logs_id_seq'::regclass);


--
-- TOC entry 5306 (class 2604 OID 29559)
-- Name: child_meal_item id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_meal_item ALTER COLUMN id SET DEFAULT nextval('public.child_meal_item_id_seq'::regclass);


--
-- TOC entry 5309 (class 2604 OID 29560)
-- Name: child_meal_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_meal_log ALTER COLUMN id SET DEFAULT nextval('public.child_meal_log_id_seq'::regclass);


--
-- TOC entry 5311 (class 2604 OID 29561)
-- Name: child_medical_reports report_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_medical_reports ALTER COLUMN report_id SET DEFAULT nextval('public.child_medical_reports_report_id_seq'::regclass);


--
-- TOC entry 5314 (class 2604 OID 29562)
-- Name: child_milestone_status id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_milestone_status ALTER COLUMN id SET DEFAULT nextval('public.child_milestone_status_id_seq'::regclass);


--
-- TOC entry 5318 (class 2604 OID 29563)
-- Name: child_milestones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_milestones ALTER COLUMN id SET DEFAULT nextval('public.child_milestones_id_seq'::regclass);


--
-- TOC entry 5321 (class 2604 OID 29564)
-- Name: child_prediction_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_prediction_reports ALTER COLUMN id SET DEFAULT nextval('public.child_prediction_reports_id_seq'::regclass);


--
-- TOC entry 5437 (class 2604 OID 33646)
-- Name: child_profile_photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profile_photos ALTER COLUMN id SET DEFAULT nextval('public.child_profile_photos_id_seq'::regclass);


--
-- TOC entry 5323 (class 2604 OID 29565)
-- Name: child_vaccine_status id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_vaccine_status ALTER COLUMN id SET DEFAULT nextval('public.child_vaccine_status_id_seq'::regclass);


--
-- TOC entry 5326 (class 2604 OID 29566)
-- Name: children child_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.children ALTER COLUMN child_id SET DEFAULT nextval('public.children_child_id_seq'::regclass);


--
-- TOC entry 5362 (class 2604 OID 32559)
-- Name: custom_doctor_drug_salts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_doctor_drug_salts ALTER COLUMN id SET DEFAULT nextval('public.custom_doctor_drug_salts_id_seq'::regclass);


--
-- TOC entry 5348 (class 2604 OID 32339)
-- Name: custom_doctor_drugs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_doctor_drugs ALTER COLUMN id SET DEFAULT nextval('public.custom_doctor_drugs_id_seq'::regclass);


--
-- TOC entry 5363 (class 2604 OID 32593)
-- Name: doctor_availability id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_availability ALTER COLUMN id SET DEFAULT nextval('public.doctor_availability_id_seq'::regclass);


--
-- TOC entry 5372 (class 2604 OID 32767)
-- Name: doctor_place_role_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_place_role_documents ALTER COLUMN id SET DEFAULT nextval('public.doctor_place_role_documents_id_seq'::regclass);


--
-- TOC entry 5365 (class 2604 OID 32639)
-- Name: doctor_place_roles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_place_roles ALTER COLUMN id SET DEFAULT nextval('public.doctor_place_roles_id_seq'::regclass);


--
-- TOC entry 5353 (class 2604 OID 32423)
-- Name: doctor_verification_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_verification_documents ALTER COLUMN id SET DEFAULT nextval('public.doctor_verification_documents_id_seq'::regclass);


--
-- TOC entry 5329 (class 2604 OID 29567)
-- Name: doctors doctor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors ALTER COLUMN doctor_id SET DEFAULT nextval('public.doctors_doctor_id_seq'::regclass);


--
-- TOC entry 5333 (class 2604 OID 29568)
-- Name: food_master food_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food_master ALTER COLUMN food_id SET DEFAULT nextval('public.food_master_food_id_seq'::regclass);


--
-- TOC entry 5337 (class 2604 OID 29569)
-- Name: nutrition_recipe id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrition_recipe ALTER COLUMN id SET DEFAULT nextval('public.nutrition_recipe_id_seq'::regclass);


--
-- TOC entry 5340 (class 2604 OID 29570)
-- Name: nutrition_requirement id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrition_requirement ALTER COLUMN id SET DEFAULT nextval('public.nutrition_requirement_id_seq'::regclass);


--
-- TOC entry 5434 (class 2604 OID 33623)
-- Name: parent_profile_photos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_profile_photos ALTER COLUMN id SET DEFAULT nextval('public.parent_profile_photos_id_seq'::regclass);


--
-- TOC entry 5341 (class 2604 OID 29571)
-- Name: parents parent_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parents ALTER COLUMN parent_id SET DEFAULT nextval('public.parents_parent_id_seq'::regclass);


--
-- TOC entry 5356 (class 2604 OID 32455)
-- Name: places id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places ALTER COLUMN id SET DEFAULT nextval('public.places_id_seq'::regclass);


--
-- TOC entry 5375 (class 2604 OID 32797)
-- Name: queue_access_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_access_assignments ALTER COLUMN id SET DEFAULT nextval('public.queue_access_assignments_id_seq'::regclass);


--
-- TOC entry 5384 (class 2604 OID 32957)
-- Name: queue_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_assignments ALTER COLUMN id SET DEFAULT nextval('public.queue_assignments_id_seq'::regclass);


--
-- TOC entry 5379 (class 2604 OID 32871)
-- Name: queue_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_items ALTER COLUMN id SET DEFAULT nextval('public.queue_items_id_seq'::regclass);


--
-- TOC entry 5367 (class 2604 OID 32685)
-- Name: queues id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues ALTER COLUMN id SET DEFAULT nextval('public.queues_id_seq'::regclass);


--
-- TOC entry 5369 (class 2604 OID 32713)
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_id_seq'::regclass);


--
-- TOC entry 5382 (class 2604 OID 32933)
-- Name: staff_availability id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_availability ALTER COLUMN id SET DEFAULT nextval('public.staff_availability_id_seq'::regclass);


--
-- TOC entry 5345 (class 2604 OID 29572)
-- Name: vaccination_schedule id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vaccination_schedule ALTER COLUMN id SET DEFAULT nextval('public.vaccination_schedule_id_seq'::regclass);


--
-- TOC entry 5389 (class 2604 OID 33045)
-- Name: visit_advice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_advice ALTER COLUMN id SET DEFAULT nextval('public.visit_advice_id_seq'::regclass);


--
-- TOC entry 5400 (class 2604 OID 33107)
-- Name: visit_diagnoses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_diagnoses ALTER COLUMN id SET DEFAULT nextval('public.visit_diagnoses_id_seq'::regclass);


--
-- TOC entry 5403 (class 2604 OID 33141)
-- Name: visit_doctors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_doctors ALTER COLUMN id SET DEFAULT nextval('public.visit_doctors_id_seq'::regclass);


--
-- TOC entry 5406 (class 2604 OID 33187)
-- Name: visit_documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_documents ALTER COLUMN id SET DEFAULT nextval('public.visit_documents_id_seq'::regclass);


--
-- TOC entry 5408 (class 2604 OID 33221)
-- Name: visit_followups id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_followups ALTER COLUMN id SET DEFAULT nextval('public.visit_followups_id_seq'::regclass);


--
-- TOC entry 5420 (class 2604 OID 33413)
-- Name: visit_injections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_injections ALTER COLUMN id SET DEFAULT nextval('public.visit_injections_id_seq'::regclass);


--
-- TOC entry 5421 (class 2604 OID 33481)
-- Name: visit_medicines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_medicines ALTER COLUMN id SET DEFAULT nextval('public.visit_medicines_id_seq'::regclass);


--
-- TOC entry 5411 (class 2604 OID 33261)
-- Name: visit_prescription_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_prescription_items ALTER COLUMN id SET DEFAULT nextval('public.visit_prescription_items_id_seq'::regclass);


--
-- TOC entry 5424 (class 2604 OID 33521)
-- Name: visit_procedures id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_procedures ALTER COLUMN id SET DEFAULT nextval('public.visit_procedures_id_seq'::regclass);


--
-- TOC entry 5413 (class 2604 OID 33295)
-- Name: visit_referrals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_referrals ALTER COLUMN id SET DEFAULT nextval('public.visit_referrals_id_seq'::regclass);


--
-- TOC entry 5416 (class 2604 OID 33335)
-- Name: visit_symptoms id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_symptoms ALTER COLUMN id SET DEFAULT nextval('public.visit_symptoms_id_seq'::regclass);


--
-- TOC entry 5425 (class 2604 OID 33549)
-- Name: visit_vaccines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_vaccines ALTER COLUMN id SET DEFAULT nextval('public.visit_vaccines_id_seq'::regclass);


--
-- TOC entry 5418 (class 2604 OID 33361)
-- Name: visit_vitals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_vitals ALTER COLUMN id SET DEFAULT nextval('public.visit_vitals_id_seq'::regclass);


--
-- TOC entry 5386 (class 2604 OID 32995)
-- Name: visits id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits ALTER COLUMN id SET DEFAULT nextval('public.visits_id_seq'::regclass);


--
-- TOC entry 5953 (class 0 OID 33594)
-- Dependencies: 314
-- Data for Name: addresses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addresses (id, line1, line2, area_locality, city, state, pincode, country, created_at) FROM stdin;
1	G1, Incubation	GLS UNIVERSITY	Law Gardern	Ahmedabad	Gujarat	380015	India	2026-01-26 14:50:33.231495
\.


--
-- TOC entry 5858 (class 0 OID 29309)
-- Dependencies: 219
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
2f3c9c8d1b7a
\.


--
-- TOC entry 5900 (class 0 OID 32510)
-- Dependencies: 261
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.appointments (id, child_id, place_id, doctor_id, booked_by, booked_by_id, reason, appointment_time, status, created_at) FROM stdin;
\.


--
-- TOC entry 5859 (class 0 OID 29313)
-- Dependencies: 220
-- Data for Name: child_anthropometry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_anthropometry (id, child_id, log_date, height_cm, weight_kg, muac_cm, avg_sleep_hours_per_day, created_at, updated_at) FROM stdin;
3	1	2025-11-11	63	6.5	\N	14	2025-11-11 19:26:47.878092	2025-11-11 19:26:47.878092
1	1	2025-07-15	55	4.5	\N	0	2025-11-09 21:10:15.240212	2025-11-09 21:10:15.240212
2	1	2025-09-15	60	5.8	\N	14	2025-11-09 21:12:32.14641	2025-11-09 21:12:32.14641
4	2	2025-12-05	120	30	12	15	2025-12-05 12:28:07.632372	2025-12-05 12:28:07.632372
\.


--
-- TOC entry 5861 (class 0 OID 29324)
-- Dependencies: 222
-- Data for Name: child_illness_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_illness_logs (id, child_id, fever, cold, cough, sore_throat, headache, stomach_ache, nausea, vomiting, diarrhea, rash, fatigue, loss_of_appetite, temperature_c, temperature_time, symptom_start_date, severity, is_current, resolved_on, resolved_by, notes, created_at, updated_at) FROM stdin;
17	1	t	f	f	f	f	f	f	f	f	f	f	f	37	2025-11-05 20:14:39.802	2025-11-05 20:14:00	MILD	f	2025-11-05 20:15:10.403	DOCTOR		2025-11-05 20:15:03.947384	2025-11-05 20:15:41.639914
18	1	f	t	f	f	f	f	f	f	f	f	f	f	37	2025-11-05 20:15:53.964	2025-11-05 20:15:00	CRITICAL	f	2025-11-05 20:15:00	PARENT	Modi ji ki kripa se thik ho gaya	2025-11-05 20:17:11.570453	2025-11-05 20:17:11.570453
19	1	t	t	f	f	f	f	f	f	t	f	f	f	40.3	2025-11-05 22:16:00	2025-11-05 22:16:00	MODERATE	t	\N	\N		2025-11-05 22:19:08.123732	2025-11-05 22:19:08.123732
20	2	f	t	f	f	f	f	f	f	f	f	f	f	37	2025-12-01 12:42:00	2025-12-01 12:42:00	MILD	f	2025-12-02 12:42:00	PARENT		2025-12-05 12:43:24.212417	2025-12-05 12:43:24.212417
\.


--
-- TOC entry 5863 (class 0 OID 29362)
-- Dependencies: 224
-- Data for Name: child_meal_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_meal_item (id, meal_log_id, meal_type, food_id, custom_food_name, serving_size_g, is_ai_estimated, energy_kcal, protein_g, carb_g, fat_g, iron_mg, calcium_mg, vitamin_a_mcg, vitamin_c_mg, meal_frequency) FROM stdin;
11	4	BREAKFAST	\N	Bajare ki roti	20	t	72.69	2.07	13.85	1.44	0.54	6.78	0	0	1
12	4	MID_MORNING	\N	Chana daal	50	t	55.3	2.97	9.74	1.26	1.47	20.25	0	0.62	1
13	4	LUNCH	\N	Sev mamra	10	t	47.92	1.04	6.32	1.75	0.24	3.42	0	0.12	1
14	4	EVENING_SNACK	\N	Aalu puri	10	t	23.49	0.42	3.46	1.04	0.13	2.32	1.04	0.22	1
15	4	DINNER	\N	Bhajiya	10	t	32.34	1.02	3.42	1.74	0.21	4.47	1.09	0.14	1
16	7	BREAKFAST	1	\N	200	f	140	2	14	8	0.2	70	100	4	5
17	7	MID_MORNING	1	\N	200	f	140	2	14	8	0.2	70	100	4	2
18	7	LUNCH	1	\N	200	f	140	2	14	8	0.2	70	100	4	2
19	7	EVENING_SNACK	1	\N	200	f	140	2	14	8	0.2	70	100	4	2
20	7	DINNER	\N	Samosa	200	t	527.78	7.48	63.34	29.18	2.88	49.18	20.58	4.38	2
26	9	BREAKFAST	1	\N	10	f	7	0.1	0.7000000000000001	0.4	0.010000000000000002	3.5	5	0.2	5
27	9	MID_MORNING	1	\N	20	f	14	0.2	1.4000000000000001	0.8	0.020000000000000004	7	10	0.4	2
28	9	LUNCH	1	\N	10	f	7	0.1	0.7000000000000001	0.4	0.010000000000000002	3.5	5	0.2	1
29	9	EVENING_SNACK	2	\N	20	f	13	0.24	1.2000000000000002	0.7000000000000001	0.020000000000000004	8	12	0	2
30	9	DINNER	1	\N	50	f	35	0.5	3.5	2	0.05	17.5	25	1	10
31	10	BREAKFAST	28	\N	100	f	125	4	20	2	0.75	15	10	0	5
32	10	MID_MORNING	21	\N	10	f	9	0.31000000000000005	0.45	0.6000000000000001	0.010000000000000002	8	4	0	2
33	10	LUNCH	27	\N	100	f	140	4	16.666666666666664	5.333333333333333	0.6666666666666666	16.666666666666664	16.666666666666664	0	7
34	10	EVENING_SNACK	1	\N	30	f	21	0.3	2.1	1.2	0.03	10.5	15	0.6	5
35	10	DINNER	4	\N	10	f	4.5	0.15000000000000002	0.8	0.06	0.03	1.5	2	1	5
36	11	BREAKFAST	\N	Aalu sendwich	120	t	206.94	4.69	29.03	9.78	1.48	24.7	0	8.38	7
37	11	MID_MORNING	5	\N	50	f	60	1.8333333333333333	9.333333333333332	1.3333333333333333	0.3333333333333333	8.333333333333332	6.666666666666666	0	7
38	11	LUNCH	27	\N	100	f	140	4	16.666666666666664	5.333333333333333	0.6666666666666666	16.666666666666664	16.666666666666664	0	7
39	11	EVENING_SNACK	22	\N	50	f	43.75	0.375	11.25	0.125	0.1875	3.75	12.5	3.125	7
40	11	DINNER	26	\N	100	f	50	2	10	1	1	40	20	5	5
41	11	DINNER	28	\N	100	f	125	4	20	2	0.75	15	10	0	5
42	12	BREAKFAST	2	\N	20	f	13	0.24	1.2000000000000002	0.7000000000000001	0.020000000000000004	8	12	0	3
43	12	MID_MORNING	4	\N	10	f	4.5	0.15000000000000002	0.8	0.06	0.03	1.5	2	1	2
44	12	LUNCH	1	\N	20	f	14	0.2	1.4000000000000001	0.8	0.020000000000000004	7	10	0.4	7
45	12	EVENING_SNACK	1	\N	20	f	14	0.2	1.4000000000000001	0.8	0.020000000000000004	7	10	0.4	5
46	12	DINNER	20	\N	30	f	20.099999999999998	0.9899999999999999	1.5	1.05	0.03	36	18	0	2
47	13	BREAKFAST	1	\N	200	f	140	2	14	8	0.2	70	100	4	7
48	13	MID_MORNING	\N	Tomato soup	20	t	4.96	0.19	1.11	0.08	0.09	2.06	2.04	1.03	2
49	13	LUNCH	4	\N	20	f	9	0.30000000000000004	1.6	0.12	0.06	3	4	2	3
50	13	EVENING_SNACK	1	\N	20	f	14	0.2	1.4000000000000001	0.8	0.020000000000000004	7	10	0.4	7
51	13	DINNER	3	\N	30	f	33	0.6	6.8999999999999995	0.44999999999999996	0.06	2.4	0	0	5
\.


--
-- TOC entry 5865 (class 0 OID 29374)
-- Dependencies: 226
-- Data for Name: child_meal_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_meal_log (id, child_id, log_date, notes, created_at) FROM stdin;
4	1	2025-11-09	\N	2025-11-09 15:46:40.683837
7	1	2025-11-09	\N	2025-11-09 21:45:01.769437
9	1	2025-11-18	\N	2025-11-18 18:02:46.283078
10	1	2025-11-18	\N	2025-11-18 18:29:24.145058
11	2	2025-12-05	\N	2025-12-05 12:33:11.708105
12	1	2025-12-05	\N	2025-12-05 19:50:09.458485
13	1	2025-12-25	\N	2025-12-25 19:59:43.068644
\.


--
-- TOC entry 5867 (class 0 OID 29385)
-- Dependencies: 228
-- Data for Name: child_medical_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_medical_reports (report_id, child_id, report_type, title, description, mime_type, file_size, storage_path, encrypted_dek, dek_nonce, file_nonce, created_at, updated_at) FROM stdin;
1	1	PRESCRIPTION	TechSentinals Hospitals repor	this is report for cold to dhruv	image/png	6045053	1\\1.bin	Jz2eZRdaMOiHs7RaSb4_OGaozN8olRSJ9RLC6LXFc2zJgzlp0GAtGdGuabSX7TPa	x2q4cPsbEejdAO8y	f2iC6XuDTQ6esdsH	2025-12-28 23:33:13.091927	2025-12-28 23:33:13.091927
3	1	LAB_REPORT	Dr vansh	Required tablets for my baby dhruv.	image/jpeg	410328	1\\3.bin	o2Sz403pA1YNQf2J1tFBY1SHQ4VMzlqPfu5e-V_ZPspJRVhzQU2jiWfxeHCD86RD	Vmu1mm3Ckklm4Ys7	cUyDvjMsuhQLONrb	2025-12-29 01:25:48.318406	2025-12-29 01:25:48.318406
\.


--
-- TOC entry 5869 (class 0 OID 29404)
-- Dependencies: 230
-- Data for Name: child_milestone_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_milestone_status (id, child_id, milestone_id, achieved_date, difficulty, special_milestone, created_at, updated_at) FROM stdin;
13	1	1	2024-02-03	NORMAL	t	2025-11-04 00:27:44.888683	2025-11-04 00:27:44.888683
14	1	2	2015-01-01	EASY	t	2025-11-04 00:28:10.312627	2025-11-04 00:28:10.312627
15	1	3	2025-11-03	NORMAL	t	2025-11-04 00:28:20.391423	2025-11-04 00:28:20.391423
16	2	4	2022-11-04	DIFFICULT	t	2025-11-04 15:25:05.2767	2025-11-04 15:25:05.2767
17	2	5	2026-01-05	NORMAL	f	2026-01-05 23:16:30.265626	2026-01-05 23:16:30.265626
\.


--
-- TOC entry 5871 (class 0 OID 29417)
-- Dependencies: 232
-- Data for Name: child_milestones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_milestones (id, category, milestone_code, milestone_name, sub_feature_1, sub_feature_2, sub_feature_3, created_at, updated_at) FROM stdin;
1	INFANT	milestone_smile	Social Smile	Eye contact	Social smile	Responds to faces	2025-11-03 17:45:45.837321	2025-11-03 17:45:45.837321
2	INFANT	milestone_roll	Rolling Over	Rolls front-to-back	Rolls both sides	Pushes up on tummy	2025-11-03 17:45:45.87695	2025-11-03 17:45:45.87695
3	INFANT	milestone_sit	Sitting	Sits with support	Sits without support	Reaches while sitting	2025-11-03 17:45:45.880227	2025-11-03 17:45:45.880227
4	TODDLER	milestones_language	Language Development	Says single words	Understands simple commands	Combines 2 words	2025-11-03 17:45:45.883064	2025-11-03 17:45:45.883064
5	TODDLER	milestones_walking	Walking	Stands alone	Takes few steps	Walks steadily	2025-11-03 17:45:45.885657	2025-11-03 17:45:45.885657
6	PRESCHOOL	milestone_speech_clarity	Speech Clarity	Speaks clearly	Forms full sentences	Uses correct words	2025-11-03 17:45:45.888239	2025-11-03 17:45:45.888239
7	PRESCHOOL	milestone_social_play	Social Play	Plays with peers	Shares toys	Follows group rules	2025-11-03 17:45:45.891481	2025-11-03 17:45:45.891481
8	SCHOOL_AGE	milestone_learning_skill	Learning Skill	Reads simple stories	Solves basic math	Pays attention in class	2025-11-03 17:45:45.895014	2025-11-03 17:45:45.895014
9	SCHOOL_AGE	milestone_social_skill	Social Skill	Makes friends	Works in teams	Shows empathy	2025-11-03 17:45:45.898754	2025-11-03 17:45:45.898754
\.


--
-- TOC entry 5873 (class 0 OID 29431)
-- Dependencies: 234
-- Data for Name: child_prediction_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_prediction_reports (id, child_id, age_group, created_at, is_existing, age_days, age_months, age_years, sex, weight_kg, height_cm, muac_cm, bmi, weight_zscore, height_zscore, feeding_type, feeding_frequency, vaccination_status, sleep_hours, illness_fever, illness_cold, illness_diarrhea, milestone_smile, milestone_roll, milestone_sit, milestones_language, milestones_walking, milestone_speech_clarity, milestone_social_play, milestone_learning_skill, milestone_social_skill, avg_weight_gain, weight_velocity, illness_freq_trend, growth_percentile, nutrition_flag, prob_fever, prob_cold, prob_diarrhea, milestone_sit_delay_prob, milestones_language_delay_prob, milestones_walking_delay_prob, milestone_speech_delay_prob, milestone_social_play_delay_prob, milestone_learning_delay_prob, milestone_social_skill_delay_prob) FROM stdin;
13	1	INFANT	2025-11-18 20:46:42.048441	1	139	0	0	0	6.5	63	12.185	16.377	-0.654	-0.426	0	10	2	14	2	2	1	1	1	1	\N	\N	\N	\N	\N	\N	0.504	0.017	1	41.718	0	0.306	0.261	0.21	\N	\N	\N	\N	\N	\N	\N
15	1	INFANT	2025-12-05 19:50:13.110971	1	156	0	0	0	6.5	63	12.185	16.377	-1.291	-1.375	0	10	2	14	2	2	1	1	1	1	\N	\N	\N	\N	\N	\N	0.504	0.017	1	28.918	0	0.335	0.268	0.238	\N	\N	\N	\N	\N	\N	\N
16	1	INFANT	2025-12-28 13:03:08.356793	1	179	0	0	0	6.5	63	12.185	16.377	-1.291	-1.375	0	10	2	14	2	2	1	1	1	1	\N	\N	\N	\N	\N	\N	0.504	0.017	1	28.957	0	0.335	0.269	0.234	\N	\N	\N	\N	\N	\N	\N
17	1	INFANT	2025-12-29 00:14:08.035671	1	180	0	0	0	6.5	63	12.185	16.377	-1.797	-2.16	0	10	2	14	2	2	1	1	1	1	\N	\N	\N	\N	\N	\N	0.504	0.017	1	19.696	1	0.37	0.286	0.269	\N	\N	\N	\N	\N	\N	\N
14	2	TODDLER	2025-12-05 13:12:48.445004	0	0	37	0	0	30	120	12	20.833	5.195	5.406	0	10	2	15	0	1	0	\N	\N	\N	1	0	\N	\N	\N	\N	0	0	0.333	91.603	0	0.99	0.147	0.116	\N	\N	0.9	\N	\N	\N	\N
\.


--
-- TOC entry 5957 (class 0 OID 33643)
-- Dependencies: 318
-- Data for Name: child_profile_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_profile_photos (id, child_id, photo_url, mime_type, file_size, created_at, updated_at) FROM stdin;
1	1	children/1/profile.jpg	image/jpeg	1119988	2026-02-02 19:25:59.709913	2026-02-02 19:25:59.709913
\.


--
-- TOC entry 5875 (class 0 OID 29440)
-- Dependencies: 236
-- Data for Name: child_vaccine_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.child_vaccine_status (id, child_id, schedule_id, dose_number, status, scheduled_text, scheduled_date, actual_date, notes, created_at, updated_at, side_effects) FROM stdin;
35	1	35	1	COMPLETED	At birth	\N	2025-11-02	Yes he has bhot bhukar	2025-11-02 22:36:03.049203	2025-11-02 22:36:03.049203	Mild fever, Soreness at injection site, Fussiness/irritability, Loss of appetite
36	1	36	1	COMPLETED	At birth	\N	2025-10-05	\N	2025-11-02 22:38:15.429816	2025-11-02 22:38:15.429816	Mild fever, Soreness at injection site, Fussiness/irritability, Loss of appetite
38	1	38	1	COMPLETED	6, 10, 14 weeks	\N	2025-11-02	\N	2025-11-02 23:09:47.391736	2025-11-02 23:09:47.391736	\N
44	1	38	2	COMPLETED	6, 10, 14 weeks	\N	2025-11-02	\N	2025-11-02 23:27:52.496428	2025-11-02 23:27:52.496428	\N
45	1	38	3	COMPLETED	6, 10, 14 weeks	\N	2025-11-02	\N	2025-11-02 23:28:38.874764	2025-11-02 23:28:38.874764	Soreness at injection site
46	2	47	1	COMPLETED	15-18 months	\N	2025-11-02	\N	2025-11-02 23:29:43.560365	2025-11-02 23:29:43.560365	\N
47	2	48	1	COMPLETED	15-18 months	\N	2025-11-02	\N	2025-11-02 23:29:54.695536	2025-11-02 23:29:54.695536	\N
\.


--
-- TOC entry 5877 (class 0 OID 29455)
-- Dependencies: 238
-- Data for Name: children; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.children (child_id, parent_id, full_name, gender, blood_group, date_of_birth, created_at, updated_at) FROM stdin;
2	1	Priyansh patel	Male	A+	2022-11-02	2025-11-02 16:49:06.398375	2025-11-02 16:49:06.398375
1	1	Dhruv Solanki	Male	AB-	2025-07-02	2025-11-02 14:45:03.262049	2025-11-02 20:11:45.322028
3	1	Mihir Solanki	Male	A+	2018-01-01	2025-11-18 19:03:20.800811	2025-11-18 19:03:20.800811
\.


--
-- TOC entry 5902 (class 0 OID 32556)
-- Dependencies: 263
-- Data for Name: custom_doctor_drug_salts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_doctor_drug_salts (id, custom_drug_id, salt_name, strength_value, strength_unit) FROM stdin;
\.


--
-- TOC entry 5892 (class 0 OID 32336)
-- Dependencies: 253
-- Data for Name: custom_doctor_drugs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_doctor_drugs (id, doctor_id, brand_name, generic_name, dosage_form, manufacturer, is_combo, created_at) FROM stdin;
\.


--
-- TOC entry 5893 (class 0 OID 32359)
-- Dependencies: 254
-- Data for Name: doctor_auth; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_auth (doctor_id, password_hash, last_login) FROM stdin;
3	$2b$12$fWV8uE60NTHidVfu80YA6.bKGwSInG5r5WQGj2lFTGFH7jbmkba/S	2026-02-01 17:05:20.836736
2	$2b$12$cqCN7JBSUkP6BW3LB5piEueDduMC7WV6477y8dJsuObZYUwZNfBdq	2026-02-02 17:41:18.554827
\.


--
-- TOC entry 5904 (class 0 OID 32590)
-- Dependencies: 265
-- Data for Name: doctor_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_availability (id, doctor_id, place_id, day_of_week, start_time, end_time, is_active) FROM stdin;
\.


--
-- TOC entry 5912 (class 0 OID 32764)
-- Dependencies: 273
-- Data for Name: doctor_place_role_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_place_role_documents (id, doctor_place_role_id, document_type, document_name, document_url, status, reviewed_by_type, reviewed_by, reviewed_at, review_notes, created_at) FROM stdin;
1	1	CLINIC_LICENSE	My licence	places/1/roles/1/1.jpg	APPROVED	\N	\N	\N	\N	2026-01-26 14:50:33.231495
2	2	HOSPITAL_AUTHORIZATION	Owner2	places/1/roles/2/2.jpg	REJECTED	OWNER	2	2026-02-01 09:30:33.487813	Document is unclear / blurred	2026-01-31 16:27:04.737742
5	2	OWNER_DECLARATION	Auth	places/1/roles/2/5.pdf	REJECTED	OWNER	2	2026-02-01 16:56:36.446697	Document is unclear / blurred\nWrong document uploaded	2026-02-01 15:37:48.511657
6	2	HOSPITAL_AUTHORIZATION	Om Shati 234	places/1/roles/2/6.jpg	APPROVED	OWNER	2	2026-02-01 17:04:53.540488		2026-02-01 16:57:48.144482
\.


--
-- TOC entry 5906 (class 0 OID 32636)
-- Dependencies: 267
-- Data for Name: doctor_place_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_place_roles (id, doctor_id, place_id, role, status, changed_by, changed_at, approved_by_type, joined_at, suspended_reason) FROM stdin;
1	2	1	OWNER	APPROVED	\N	\N	\N	\N	\N
2	3	1	CONSULTING	APPROVED	2	2026-02-01 17:04:53.540515	OWNER	2026-02-01 17:04:53.540515	Doctor is not eligible for this workplace role
\.


--
-- TOC entry 5894 (class 0 OID 32385)
-- Dependencies: 255
-- Data for Name: doctor_status; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_status (doctor_id, status, reason, set_by, updated_at) FROM stdin;
2	ACTIVE	\N	ADMIN	2026-01-24 23:01:01.473575
3	INACTIVE	\N	ADMIN	2026-01-31 16:02:01.686331
\.


--
-- TOC entry 5896 (class 0 OID 32420)
-- Dependencies: 257
-- Data for Name: doctor_verification_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctor_verification_documents (id, doctor_id, document_type, document_name, document_url, status, reviewed_by, reviewed_at, review_notes, created_at) FROM stdin;
1	2	MEDICAL_REGISTRATION	Degree	doctors/2/1.jpg	PENDING	\N	\N		2026-01-24 23:01:01.473575
4	3	DEGREE_CERTIFICATE	Okk	doctors/3/4.jpg	PENDING	\N	\N	\N	2026-01-31 16:02:01.686331
\.


--
-- TOC entry 5879 (class 0 OID 29467)
-- Dependencies: 240
-- Data for Name: doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.doctors (doctor_id, full_name, email, phone_number, specialization, created_at, updated_at, registration_number, registration_council, experience_years, qualifications, is_verified) FROM stdin;
2	Dr Ashwin Solanki	ashwinsolanki9898@gmail.com	+918128839609	PEDIATRICS	2026-01-24 23:00:22.535553	2026-01-24 23:00:22.535553	ABCD151515	AIMMS	10	MBBS	t
3	Dr Dhruv Solanki	ashwinsolanki9898@gmail.con	+918128839608	PEDIATRICS	2026-01-31 15:52:40.68548	2026-01-31 15:52:40.68548	AOMP6828212	GMDC	5	MD (Pediatrics)	t
\.


--
-- TOC entry 5881 (class 0 OID 29482)
-- Dependencies: 242
-- Data for Name: food_master; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.food_master (food_id, food_name, category_age_group, food_group, avg_serving_g, energy_kcal, protein_g, carb_g, fat_g, iron_mg, calcium_mg, vitamin_a_mcg, vitamin_c_mg, is_veg, created_at, updated_at) FROM stdin;
1	Breast milk	INFANT	milk	100	70	1	7	4	0.1	35	50	2	t	2025-11-08 12:39:58.77469	2025-11-08 12:39:58.77469
2	Formula milk	INFANT	milk	100	65	1.2	6	3.5	0.1	40	60	0	t	2025-11-08 12:39:58.792694	2025-11-08 12:39:58.792694
3	Rice porridge	INFANT	cereal	100	110	2	23	1.5	0.2	8	0	0	t	2025-11-08 12:39:58.799279	2025-11-08 12:39:58.799279
4	Mixed vegetable soup	INFANT	vegetable	100	45	1.5	8	0.6	0.3	15	20	10	t	2025-11-08 12:39:58.803544	2025-11-08 12:39:58.803544
5	Khichdi	TODDLER	mixed	150	180	5.5	28	4	1	25	20	0	t	2025-11-08 12:39:58.807745	2025-11-08 12:39:58.807745
6	Suji upma	TODDLER	cereal	100	130	3	21	3	0.5	15	30	2	t	2025-11-08 12:39:58.812185	2025-11-08 12:39:58.812185
7	Idli	TODDLER	cereal	50	60	2	12	0.4	0.2	8	10	0	t	2025-11-08 12:39:58.817607	2025-11-08 12:39:58.817607
8	Suji halwa	TODDLER	sweet	60	150	2	25	5	0.3	10	0	0	t	2025-11-08 12:39:58.821355	2025-11-08 12:39:58.821355
9	Chapati	PRESCHOOL	cereal	40	120	3	20	2	1	10	0	0	t	2025-11-08 12:39:58.824614	2025-11-08 12:39:58.824614
10	Dal (cooked)	PRESCHOOL	pulse	100	110	6	15	2	1.5	25	10	0	t	2025-11-08 12:39:58.829595	2025-11-08 12:39:58.829595
11	Rice (cooked)	PRESCHOOL	cereal	100	130	2.4	28	0.3	0.2	10	0	0	t	2025-11-08 12:39:58.832927	2025-11-08 12:39:58.832927
12	Paneer	PRESCHOOL	milk	50	130	8	3	10	0.2	100	50	0	t	2025-11-08 12:39:58.835752	2025-11-08 12:39:58.835752
13	Vegetable curry	PRESCHOOL	vegetable	100	90	2	10	4	1	40	20	8	t	2025-11-08 12:39:58.838382	2025-11-08 12:39:58.838382
14	Dosa	PRESCHOOL	cereal	100	160	3.5	25	4.5	1	25	15	0	t	2025-11-08 12:39:58.840756	2025-11-08 12:39:58.840756
15	Paratha	SCHOOLAGE	cereal	80	220	5	25	10	1	20	20	0	t	2025-11-08 12:39:58.843897	2025-11-08 12:39:58.843897
16	Poha	SCHOOLAGE	cereal	100	140	3	26	3	0.8	10	0	0	t	2025-11-08 12:39:58.847435	2025-11-08 12:39:58.847435
17	Biryani	SCHOOLAGE	mixed	150	290	10	35	10	1	25	20	0	f	2025-11-08 12:39:58.850172	2025-11-08 12:39:58.850172
18	Chicken curry	SCHOOLAGE	meat	150	270	25	5	16	2	25	50	0	f	2025-11-08 12:39:58.852855	2025-11-08 12:39:58.852855
19	Fish curry	SCHOOLAGE	meat	150	230	22	3	13	1.5	30	45	0	f	2025-11-08 12:39:58.855254	2025-11-08 12:39:58.855254
20	Milk	ALL	milk	100	67	3.3	5	3.5	0.1	120	60	0	t	2025-11-08 12:39:58.857699	2025-11-08 12:39:58.857699
21	Curd	ALL	milk	100	90	3.1	4.5	6	0.1	80	40	0	t	2025-11-08 12:39:58.86051	2025-11-08 12:39:58.86051
22	Banana	ALL	fruit	80	70	0.6	18	0.2	0.3	6	20	5	t	2025-11-08 12:39:58.864235	2025-11-08 12:39:58.864235
23	Apple	ALL	fruit	100	50	0.3	13	0.1	0.1	6	54	4	t	2025-11-08 12:39:58.866967	2025-11-08 12:39:58.866967
24	Boiled egg	PRESCHOOL	egg	50	70	6.3	0.6	5	1.2	25	100	0	f	2025-11-08 12:39:58.869384	2025-11-08 12:39:58.869384
25	Sprouts	SCHOOLAGE	pulse	50	85	5	14	1	1.5	30	0	0	t	2025-11-08 12:39:58.871774	2025-11-08 12:39:58.871774
26	Seasonal vegetables	ALL	vegetable	100	50	2	10	1	1	40	20	5	t	2025-11-08 12:39:58.874387	2025-11-08 12:39:58.874387
27	Roti-sabzi	ALL	mixed	150	210	6	25	8	1	25	25	0	t	2025-11-08 12:39:58.877546	2025-11-08 12:39:58.877546
28	Rice-dal combo	ALL	mixed	200	250	8	40	4	1.5	30	20	0	t	2025-11-08 12:39:58.882	2025-11-08 12:39:58.882
\.


--
-- TOC entry 5883 (class 0 OID 29495)
-- Dependencies: 244
-- Data for Name: nutrition_recipe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nutrition_recipe (id, age_min_months, age_max_months, recipe_code, recipe_name, veg_nonveg, primary_nutrient, secondary_nutrients, energy_density, meal_type, texture, ingredients, instructions, prep_time_mins, youtube_url, created_at, updated_at) FROM stdin;
1	0	5	0-5-energy_kcal-01	Breastfeeding Guidance (support)	veg	energy_kcal	fat_g	high	feeding_guidance	liquid	Breastmilk (on demand). Mother: balanced diet, hydration.	Encourage exclusive, on-demand breastfeeding. Offer skin-to-skin, frequent feeds; seek lactation support if difficulties.	0	https://www.youtube.com/watch?v=leuiua2aPco	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
2	0	5	0-5-energy_kcal-02	Infant Formula Preparation (age-appropriate)	veg	energy_kcal	protein_g,calcium_mg	high	feeding_guidance	liquid	Commercial infant formula, safe potable water	Follow manufacturer dilution instructions. Use sterile bottles, prepare fresh feeds, discard leftovers. Seek pediatrician before formula use.	5	https://www.youtube.com/watch?v=eX8BRdDgAu8	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
3	0	5	0-5-protein_g-01	Exclusive Breastfeeding for Protein	veg	protein_g	energy_kcal,fat_g	high	feeding_guidance	liquid	Breastmilk (on demand)	Encourage frequent breastfeeding (8-12 times per day) to provide adequate protein for growth and development.	0	https://www.youtube.com/watch?v=lJQTPoK9IYc	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
4	0	5	0-5-protein_g-02	Infant Formula for Protein Needs	veg	protein_g	energy_kcal,calcium_mg	high	feeding_guidance	liquid	Commercial infant formula, safe water	Prepare formula following guidelines to ensure protein intake matches age needs. Consult pediatrician.	5	https://www.youtube.com/watch?v=zr1ZcoXLcKY	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
5	0	5	0-5-iron_mg-01	Breastmilk Iron Provision in Early Months	veg	iron_mg	energy_kcal	high	feeding_guidance	liquid	Breastmilk	Exclusive breastfeeding supports iron stores from birth; continue without supplements unless advised.	0	https://www.youtube.com/watch?v=03CNqWVq1ys	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
6	0	5	0-5-iron_mg-02	Formula Feeding for Iron	veg	iron_mg	protein_g	high	feeding_guidance	liquid	Iron-fortified infant formula	Use iron-fortified formula if breastfeeding not possible; prepare as directed.	5	https://www.youtube.com/watch?v=VHVH9nRutfs	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
7	0	5	0-5-calcium_mg-01	Breastmilk for Calcium Support	veg	calcium_mg	energy_kcal,protein_g	high	feeding_guidance	liquid	Breastmilk (on demand)	Frequent breastfeeding ensures calcium for bone development; maintain maternal calcium-rich diet.	0	https://www.youtube.com/watch?v=gO2E1oY8ofo	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
8	0	5	0-5-calcium_mg-02	Formula Preparation for Calcium	veg	calcium_mg	protein_g	high	feeding_guidance	liquid	Calcium-fortified infant formula, safe water	Follow preparation instructions for calcium delivery; use fortified formula as recommended.	5	https://www.youtube.com/watch?v=O7_qZyz4ecU	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
9	0	5	0-5-vitamin_a_mcg-01	Breastmilk Vitamin A Guidance	veg	vitamin_a_mcg	energy_kcal	high	feeding_guidance	liquid	Breastmilk	Exclusive breastfeeding provides essential vitamin A for vision and immunity; feed on demand.	0	https://www.youtube.com/watch?v=3Rd3dBIGeKU	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
10	0	5	0-5-vitamin_a_mcg-02	Formula for Vitamin A Needs	veg	vitamin_a_mcg	fat_g	high	feeding_guidance	liquid	Vitamin A-fortified infant formula	Prepare fortified formula to meet vitamin A requirements; discard unused portions.	5	https://www.youtube.com/watch?v=RGrtJ1lzGLY	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
11	0	5	0-5-vitamin_c_mg-01	Breastmilk for Vitamin C	veg	vitamin_c_mg	energy_kcal	high	feeding_guidance	liquid	Breastmilk (on demand)	Breastmilk supplies vitamin C for immune support; ensure maternal intake of fruits and vegetables.	0	https://www.youtube.com/watch?v=li9WZWAg4c0	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
12	0	5	0-5-vitamin_c_mg-02	Formula Feeding for Vitamin C	veg	vitamin_c_mg	protein_g	high	feeding_guidance	liquid	Vitamin C-fortified infant formula	Use fortified formula for vitamin C; prepare fresh and consult healthcare provider.	5	https://www.youtube.com/watch?v=_ZofZusuB5U	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
13	6	11	6-11-energy_kcal-01	Ragi Banana Porridge	veg	energy_kcal	calcium_mg,carb_g	medium	breakfast	soft	Ragi flour, water, mashed banana, breastmilk/formula (optional), pinch jaggery (optional)	Roast 1 tbsp ragi flour lightly. Mix with water, simmer to thicken. Cool slightly and mash in mashed banana and a little breastmilk/formula. Serve lukewarm.	12	https://www.youtube.com/watch?v=Y6pYw1rQTtQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
14	6	11	6-11-energy_kcal-02	Rice-Dal Mash with Ghee	veg	energy_kcal	protein_g,fat_g	high	lunch	soft	Rice, yellow moong dal, carrot/potato (small), 1 tsp ghee	Cook equal parts rice and moong dal with chopped veg until very soft. Mash to desired consistency. Add 1 tsp ghee before serving.	20	https://www.youtube.com/watch?v=WLCBNECND1o	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
15	6	11	6-11-protein_g-01	Moong Dal Khichdi (soft)	veg	protein_g	energy_kcal,iron_mg	high	lunch	soft	Moong dal, rice, carrot, spinach, a little ghee	Wash moong dal and rice 1:1. Add chopped veg and pressure cook till very soft. Mash gently and add ghee. Cool to suitable temp.	25	https://www.youtube.com/watch?v=OFHxbbp-AYM	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
16	6	11	6-11-protein_g-02	Mashed Paneer with Milk (soft)	veg	protein_g	calcium_mg,energy_kcal	medium	snack	soft	Fresh paneer, breastmilk/formula/milk (as per age), banana optional	Crumble soft paneer and mash with a little milk or breastmilk to suitable consistency. Serve small portions.	5	https://www.youtube.com/watch?v=znaITjkZ34A	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
17	6	11	6-11-carb_g-01	Steamed Idli (soft)	veg	carb_g	protein_g	high	breakfast	soft	Idli batter (rice+urad dal) or instant rava idli mix, grated carrot/peas optional	Steam small idlis. For babies, mash with a little dal water or ghee as needed.	20	https://www.youtube.com/watch?v=fj2uKXWgcJ0	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
18	6	11	6-11-carb_g-02	Suji (Rava) Porridge / Halwa (baby-friendly, low sugar)	veg	carb_g	energy_kcal	high	snack	soft	Semolina (suji), water/milk, small amount ghee, jaggery optional	Roast suji lightly in ghee, add water/milk and simmer until soft. For babies, avoid excess sugar; use jaggery if needed in small amount.	12	https://www.youtube.com/watch?v=2LwDzTpNQC8	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
19	6	11	6-11-fat_g-01	Ghee Rice Mash	veg	fat_g	energy_kcal	high	lunch	soft	Soft cooked rice, 1 tsp ghee	Mash cooked rice and mix in warm ghee. Serve lukewarm in small portions.	10	https://www.youtube.com/watch?v=rdihB1IY6bg	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
20	6	11	6-11-fat_g-02	Avocado Mash (if available)	veg	fat_g	energy_kcal	low	snack	soft	Ripe avocado	Mash a small portion of ripe avocado to a smooth texture; serve small spoonfuls.	3	https://www.youtube.com/watch?v=qVq16CybWho	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
21	6	11	6-11-iron_mg-01	Ragi & Dates Porridge (iron-rich)	veg	iron_mg	energy_kcal,calcium_mg	medium	breakfast	soft	Ragi flour, water/milk, small chopped dates (small amount)	Cook ragi flour in water; add mashed dates for taste and iron boost (small amounts). Cool and serve.	12	https://www.youtube.com/watch?v=0vLY8Rn78dg	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
22	6	11	6-11-iron_mg-02	Moong Dal Khichdi with Spinach (iron)	veg	iron_mg	protein_g,energy_kcal	high	lunch	soft	Moong dal, rice, chopped spinach, carrot, ghee	Cook rice and dal with chopped spinach until very soft. Mash and add ghee. Serve warm.	25	https://www.youtube.com/watch?v=zKBGBUhO6gc	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
70	48	71	48-71-iron_mg-02	Ragi & Dates Porridge (iron boost)	veg	iron_mg	calcium_mg,energy_kcal	medium	breakfast	soft	Ragi flour, dates, milk	Cook ragi in milk, add chopped dates. Cool to suitable temp and serve.	15	https://www.youtube.com/watch?v=Y_cv1QJhZW4	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
23	6	11	6-11-calcium_mg-01	Ragi Milk Porridge	veg	calcium_mg	energy_kcal	medium	breakfast	soft	Ragi flour, milk/formula (or mix with breastmilk later), banana optional	Cook ragi in milk; cool to lukewarm and serve. Use breastmilk/formula for younger infants if needed.	12	https://www.youtube.com/watch?v=Wg0Iz8Wjn0A	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
24	6	11	6-11-calcium_mg-02	Curd Rice (small portion)	veg	calcium_mg	protein_g	medium	lunch	soft	Soft cooked rice, plain curd (yogurt)	Mix a little curd into soft rice. Serve cool or room temp. Use small portions for 6–11m as appropriate.	5	https://www.youtube.com/watch?v=sMXC55Ycx_U	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
25	6	11	6-11-vitamin_a_mcg-01	Carrot & Potato Puree (vitamin A from carrot)	veg	vitamin_a_mcg	carb_g,energy_kcal	high	lunch	soft	Carrot, potato, small ghee	Steam or boil carrot & potato till very soft. Mash thoroughly, add a little ghee.	15	https://www.youtube.com/watch?v=tYw49Pqu27Y	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
26	6	11	6-11-vitamin_a_mcg-02	Sweet Potato Puree	veg	vitamin_a_mcg	carb_g	high	snack	soft	Sweet potato, a little ghee	Bake or steam sweet potato. Mash and add a little ghee. Serve warm.	20	https://www.youtube.com/watch?v=KrxUJ34cE08	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
27	6	11	6-11-vitamin_c_mg-01	Steamed & Mashed Apple (vitamin C)	veg	vitamin_c_mg	carb_g	low	snack	soft	Apple (peeled), steam and mash	Peel, steam apple until tender, mash to smooth puree. Cool and serve.	10	https://www.youtube.com/watch?v=50l4XJvDZVk	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
28	6	11	6-11-vitamin_c_mg-02	Mashed Banana with Orange Zest (small)	veg	vitamin_c_mg	energy_kcal	low	snack	soft	Ripe banana, tiny amount of orange zest/juice (very small)	Mash banana; add a few drops of orange juice (ensure no citrus reaction) for vitamin C. Use minimal juice to avoid acidity.	5	https://www.youtube.com/watch?v=P_1yJyNa8zo	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
29	12	35	12-35-energy_kcal-01	Vegetable Khichdi with Ghee	veg	energy_kcal	protein_g,iron_mg	high	lunch	soft	Rice, moong dal, mixed vegetables (carrot, peas, spinach), ghee	Pressure-cook rice and dal with chopped vegetables till soft. Mash lightly and finish with 1 tsp ghee. Serve warm.	30	https://www.youtube.com/watch?v=WLCBNECND1o	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
30	12	35	12-35-energy_kcal-02	Rice-Dal Combo (Khichdi with ghee & dal tadka)	veg	energy_kcal	protein_g,fat_g	high	dinner	soft	Rice, mixed dal, ghee, small vegetables	Cook rice and dal together with vegetables until soft. Add ghee or butter for energy. Serve mashable portions.	25	https://www.youtube.com/watch?v=OFHxbbp-AYM	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
31	12	35	12-35-protein_g-01	Moong Dal Cheela (soft pancakes)	veg	protein_g	iron_mg,energy_kcal	high	breakfast	soft	Soaked moong dal ground to batter, grated carrot/spinach	Make thin batter from soaked dal; add grated veggies. Cook on tawa lightly with little oil/ghee. Cut into small pieces.	30	https://www.youtube.com/watch?v=mW-RkGuedc0	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
32	12	35	12-35-protein_g-02	Paneer Bhurji (soft)	veg	protein_g	calcium_mg,energy_kcal	high	snack	soft	Crumbled paneer, mild spices, peas	Crumble paneer and sauté gently with peas and a little ghee. Mash to soft texture for toddlers.	15	https://www.youtube.com/watch?v=GBz7SX74CuQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
33	12	35	12-35-carb_g-01	Soft Idli Upma with Vegetables	veg	carb_g	protein_g	high	breakfast	soft	Idli pieces or batter, vegetables, little oil/ghee	Crumble idlis and sauté with chopped vegetables and a bit of ghee for an easy, carb-rich breakfast.	15	https://www.youtube.com/watch?v=aUPUeIhSFSs	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
34	12	35	12-35-carb_g-02	Roti + Soft Vegetable Mash	veg	carb_g	fiber_g,vitamin_c_mg	medium	lunch	soft	Soft whole wheat roti, mashed seasonal vegetables	Serve well-cooked soft roti pieces with mashed vegetable curry for easy chewing.	20	https://www.youtube.com/watch?v=W0Czi-DmTlc	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
35	12	35	12-35-fat_g-01	Paneer Paratha (light, soft)	veg	fat_g	protein_g,calcium_mg	high	breakfast	semi-solid	Whole wheat flour, grated paneer, little ghee for cooking	Stuff soft paneer filling into dough and cook with a little ghee. Serve warm in small pieces.	25	https://www.youtube.com/watch?v=5uMnfbuDZWg	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
36	12	35	12-35-fat_g-02	Peanut Powder Rice (no whole nuts if choking risk)	veg	fat_g	energy_kcal	high	lunch	soft	Cooked rice, roasted peanut powder (very small quantity), ghee	Mix a small spoon of finely powdered roasted peanuts into warm rice with ghee. Ensure no whole nuts for toddler safety.	5	https://www.youtube.com/watch?v=BV9Y6iD1jeg	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
37	12	35	12-35-iron_mg-01	Spinach Khichdi (iron-rich)	veg	iron_mg	protein_g,energy_kcal	high	lunch	soft	Rice, moong dal, chopped spinach, ghee	Cook rice and dal with spinach added; mash lightly and finish with ghee. Offer warm.	25	https://www.youtube.com/watch?v=gRN9IgbqkY0	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
38	12	35	12-35-iron_mg-02	Ragi Oats Porridge with Dates	veg	iron_mg	calcium_mg,energy_kcal	medium	breakfast	soft	Ragi flour, oats, chopped dates, milk	Cook ragi + oats in milk/water. Add chopped dates for iron and sweetness. Cool to serve.	15	https://www.youtube.com/watch?v=m2JYA4WRdlY	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
39	12	35	12-35-calcium_mg-01	Milk Ragi Porridge	veg	calcium_mg	energy_kcal	medium	breakfast	soft	Ragi flour, milk (or formula), mashed banana optional	Cook ragi in milk; serve lukewarm. For toddlers, full milk is appropriate unless doctor advises otherwise.	12	https://www.youtube.com/watch?v=Y6pYw1rQTtQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
40	12	35	12-35-calcium_mg-02	Curd Rice with Grated Carrot	veg	calcium_mg	protein_g,vitamin_c_mg	medium	lunch	soft	Soft rice, plain curd, grated carrot	Mix curd into warm-cool rice with grated carrot for vitamins and calcium. Serve at room temp.	8	https://www.youtube.com/watch?v=pCh56s47KNo	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
41	12	35	12-35-vitamin_a_mcg-01	Carrot & Pumpkin Mash	veg	vitamin_a_mcg	carb_g,energy_kcal	high	lunch	soft	Carrot, pumpkin, little ghee	Steam vegetables until soft, mash and mix with ghee. Offer warm.	20	https://www.youtube.com/watch?v=p9h-J9lPguU	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
42	12	35	12-35-vitamin_a_mcg-02	Sweet Potato & Ghee Mash	veg	vitamin_a_mcg	carb_g	high	snack	soft	Cooked sweet potato, ghee	Mash cooked sweet potato and add ghee. Serve in small portions.	20	https://www.youtube.com/watch?v=KrxUJ34cE08	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
43	12	35	12-35-vitamin_c_mg-01	Fruit Mash (Apple+Orange small)	veg	vitamin_c_mg	energy_kcal	low	snack	soft	Steamed apple mashed, tiny orange juice or mashed ripe papaya	Steam apple; mash. Add minimal orange/papaya to boost vitamin C. Serve fresh.	8	https://www.youtube.com/watch?v=P_1yJyNa8zo	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
44	12	35	12-35-vitamin_c_mg-02	Spinach & Tomato Mash (cooked tomato mild)	veg	vitamin_c_mg	iron_mg,vitamin_a_mcg	high	lunch	soft	Spinach, peeled tomato, little ghee	Cook spinach with peeled tomato till very soft; mash and add ghee.	15	https://www.youtube.com/watch?v=E71hMeLXkeM	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
45	36	47	36-47-energy_kcal-01	Rice-Dal Combo (Energy-dense)	veg	energy_kcal	protein_g,fat_g	high	lunch	semi-solid	Rice, mixed dal, ghee, mild vegetables	Cook rice and dal together with vegetables until soft. Add generous ghee for energy. Serve warm.	30	https://www.youtube.com/watch?v=OFHxbbp-AYM	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
46	36	47	36-47-energy_kcal-02	Roti + Sabzi with Ghee (soft roti)	veg	energy_kcal	fat_g,carb_g	high	dinner	solid	Whole wheat roti (soft), vegetable curry, ghee	Serve soft roti with vegetable sabzi and a small spoon of ghee on top for added energy.	25	https://www.youtube.com/watch?v=W0Czi-DmTlc	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
47	36	47	36-47-protein_g-01	Khichdi with Mixed Dal + Paneer Crumble	veg	protein_g	calcium_mg,energy_kcal	high	lunch	semi-solid	Rice, mixed dal, small cubes of paneer, vegetables, ghee	Cook rice and dal; add paneer cubes or crumble paneer into hot khichdi. Finish with ghee.	30	https://www.youtube.com/watch?v=WLCBNECND1o	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
48	36	47	36-47-protein_g-02	Egg Scramble (if non-veg allowed)	non-veg	protein_g	vitamin_a_mcg,iron_mg	high	breakfast	semi-solid	Egg, little milk, butter/ghee	Scramble egg lightly in ghee; cook until just set and soft. Serve small pieces to child.	8	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
49	36	47	36-47-carb_g-01	Vegetable Pulao (soft grains)	veg	carb_g	energy_kcal	high	lunch	semi-solid	Basmati/regular rice, peas, carrots, ghee	Cook rice with vegetables and a little ghee. Serve soft and fluffy.	25	https://www.youtube.com/watch?v=vZK3y9F7N0M	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
50	36	47	36-47-carb_g-02	Roti + Potato Mash	veg	carb_g	energy_kcal	medium	dinner	solid	Soft roti, boiled and mashed potato with little ghee	Serve small roti pieces with warm potato mash. Ensure soft texture.	20	https://www.youtube.com/watch?v=97kCezePyy0	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
51	36	47	36-47-fat_g-01	Milk Banana Smoothie with Peanut Powder (if no allergy)	veg	fat_g	energy_kcal,protein_g	high	snack	semi-solid	Milk, banana, small spoon peanut powder, 1 tsp ghee/butter optional	Blend milk and banana; mix in a small amount of peanut powder. Serve in small portions.	5	https://www.youtube.com/watch?v=1nQ3Fz9vZtU	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
52	36	47	36-47-fat_g-02	Paneer Paratha (soft)	veg	fat_g	protein_g,calcium_mg	high	breakfast	solid	Whole wheat dough, grated paneer, ghee	Cook paratha with paneer stuffing on tawa using little ghee; serve warm in small pieces.	25	https://www.youtube.com/watch?v=5uMnfbuDZWg	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
53	36	47	36-47-iron_mg-01	Chana Dal & Spinach Curry with Rice (soft)	veg	iron_mg	protein_g	high	lunch	semi-solid	Chana dal (soaked), spinach, mild spices, ghee	Cook soaked chana dal until soft, add pureed spinach and mild tempering. Serve with soft rice.	40	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
54	36	47	36-47-iron_mg-02	Ragi Oats Porridge with Dates (iron boost)	veg	iron_mg	calcium_mg,energy_kcal	medium	breakfast	semi-solid	Ragi flour, oats, chopped dates, milk	Cook ragi and oats in milk; add chopped dates. Cool and serve.	15	https://www.youtube.com/watch?v=m2JYA4WRdlY	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
55	36	47	36-47-calcium_mg-01	Paneer Bhurji with Soft Roti	veg	calcium_mg	protein_g	high	dinner	semi-solid	Paneer, peas, mild spices, soft roti	Sauté crumbled paneer with peas and minimal spices, serve with soft roti.	20	https://www.youtube.com/watch?v=GBz7SX74CuQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
56	36	47	36-47-calcium_mg-02	Milk with Ragi & Dates (bedtime)	veg	calcium_mg	energy_kcal	medium	snack	semi-solid	Milk, ragi powder, dates paste	Cook ragi in milk and blend with dates paste. Cool to warm and serve.	12	https://www.youtube.com/watch?v=p_GUQfNpRpw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
57	36	47	36-47-vitamin_a_mcg-01	Carrot-Pumpkin Curry (soft)	veg	vitamin_a_mcg	carb_g,vitamin_c_mg	high	lunch	semi-solid	Carrot, pumpkin, mild spices, ghee	Cook vegetables until soft; mash lightly and add ghee. Serve warm.	25	https://www.youtube.com/watch?v=p9h-J9lPguU	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
58	36	47	36-47-vitamin_a_mcg-02	Sweet Potato & Carrot Mash with Ghee	veg	vitamin_a_mcg	energy_kcal	high	snack	semi-solid	Sweet potato, carrot, ghee	Steam sweet potato & carrot; mash and mix with ghee.	20	https://www.youtube.com/watch?v=KrxUJ34cE08	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
59	36	47	36-47-vitamin_c_mg-01	Fruit Smoothie (milk + banana + berries or papaya)	veg	vitamin_c_mg	energy_kcal,calcium_mg	medium	snack	semi-solid	Milk, banana, papaya or berries, little honey if >1yr	Blend milk with fruit. Serve small amount.	5	https://www.youtube.com/watch?v=1nQ3Fz9vZtU	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
60	36	47	36-47-vitamin_c_mg-02	Tomato & Spinach Curry (mild)	veg	vitamin_c_mg	iron_mg	high	lunch	semi-solid	Tomato, spinach, little oil/ghee	Cook peeled tomato with spinach until soft; mash lightly and serve.	20	https://www.youtube.com/watch?v=E71hMeLXkeM	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
61	48	71	48-71-energy_kcal-01	Vegetable Pulao with Paneer	veg	energy_kcal	protein_g,calcium_mg	high	lunch	solid	Rice, mixed vegetables, paneer cubes, ghee	Cook rice with vegetables and paneer cubes with adequate ghee for energy density. Serve warm.	30	https://www.youtube.com/watch?v=vZK3y9F7N0M	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
62	48	71	48-71-energy_kcal-02	Khichdi with Ghee & Mixed Dal	veg	energy_kcal	protein_g	high	dinner	semi-solid	Rice, mixed dal, vegetables, ghee	Cook together till soft, finish with ghee to raise energy content.	30	https://www.youtube.com/watch?v=OFHxbbp-AYM	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
63	48	71	48-71-protein_g-01	Chickpea Curry (softened) with Rice	veg	protein_g	iron_mg,fiber_g	high	lunch	solid	Soaked chickpeas, mild spices, tomatoes, ghee	Soak chickpeas overnight, cook until soft. Mash lightly for kids and serve with rice.	50	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
64	48	71	48-71-protein_g-02	Paneer & Peas Curry with Roti	veg	protein_g	calcium_mg,energy_kcal	high	dinner	solid	Paneer, peas, mild tomato gravy, roti	Cook paneer & peas in mild gravy; serve with soft roti.	25	https://www.youtube.com/watch?v=GBz7SX74CuQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
65	48	71	48-71-carb_g-01	Vegetable Fried Rice (mild)	veg	carb_g	protein_g	high	lunch	solid	Rice, mixed veggies, soy sauce optional, oil/ghee	Stir fry cooked rice lightly with vegetables and a little oil. Keep seasoning mild for kids.	20	https://www.youtube.com/watch?v=vZK3y9F7N0M	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
66	48	71	48-71-carb_g-02	Roti + Potato & Peas Sabzi	veg	carb_g	fiber_g,vitamin_c_mg	medium	dinner	solid	Whole wheat roti, potato, peas, mild spices	Serve soft cooked roti with mashed potato-peas sabzi.	25	https://www.youtube.com/watch?v=97kCezePyy0	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
67	48	71	48-71-fat_g-01	Paneer Butter Masala (light)	veg	fat_g	calcium_mg,protein_g	high	dinner	solid	Paneer, butter/ghee, tomato-cashew gravy (mild)	Cook paneer in mild tomato-cashew gravy with butter; keep spices low for kids.	30	https://www.youtube.com/watch?v=7MZQx3F8KpE	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
68	48	71	48-71-fat_g-02	Peanut Butter Banana Sandwich (if no allergy)	veg	fat_g	energy_kcal	high	snack	solid	Whole wheat bread, peanut butter (smooth), banana slices	Spread thin peanut butter, add banana slices and serve small sandwich halves. Ensure no whole nuts.	5	https://www.youtube.com/watch?v=Qy7MZx8FZ2E	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
69	48	71	48-71-iron_mg-01	Spinach & Chana Dal Curry (soft)	veg	iron_mg	protein_g	high	lunch	semi-solid	Chana dal, spinach, mild spices	Cook chana dal until soft. Add spinach puree and simmer. Serve with rice/roti.	40	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
71	48	71	48-71-calcium_mg-01	Paneer & Peas Curry	veg	calcium_mg	protein_g,energy_kcal	high	dinner	solid	Paneer, peas, mild gravy, butter/ghee	Cook paneer & peas in mild gravy; serve with roti or rice.	25	https://www.youtube.com/watch?v=GBz7SX74CuQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
72	48	71	48-71-calcium_mg-02	Milkshake with Almonds (age-appropriate, nut paste if safe)	veg	calcium_mg	fat_g,energy_kcal	high	snack	semi-solid	Milk, banana, soaked almond paste (optional), honey if >1yr	Blend milk with banana and very small amount of almond paste. Serve small portions.	5	https://www.youtube.com/watch?v=3MZKpF8QxY7	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
73	48	71	48-71-vitamin_a_mcg-01	Carrot & Pumpkin Kurma	veg	vitamin_a_mcg	carb_g	high	lunch	solid	Carrot, pumpkin, coconut milk (optional), mild spices	Cook vegetables until soft. Mash lightly or serve bite-sized pieces. Add little coconut milk for taste.	30	https://www.youtube.com/watch?v=p9h-J9lPguU	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
74	48	71	48-71-vitamin_a_mcg-02	Sweet Potato & Carrot Roast	veg	vitamin_a_mcg	energy_kcal	high	snack	solid	Sweet potato, carrot, light oil	Bake or roast cubes until soft. Serve slightly mashed or as small bites.	30	https://www.youtube.com/watch?v=KrxUJ34cE08	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
75	48	71	48-71-vitamin_c_mg-01	Fruit Salad with Yogurt (soft pieces)	veg	vitamin_c_mg	calcium_mg	low	snack	solid	Seasonal fruits (banana, papaya, orange segments), plain yogurt	Cut soft fruits into small pieces. Mix with plain yogurt; serve chilled (not cold).	10	https://www.youtube.com/watch?v=tZ-SfxXMdUQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
76	48	71	48-71-vitamin_c_mg-02	Tomato-Capsicum Sabzi (mild)	veg	vitamin_c_mg	vitamin_a_mcg	low	lunch	solid	Tomato, capsicum/bell pepper, little oil	Cook peeled tomatoes with chopped capsicum until soft; mash lightly for small children.	20	https://www.youtube.com/watch?v=nl0cCL82m-A	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
77	72	83	72-83-energy_kcal-01	Rice + Mixed Dal + Vegetable Curry	veg	energy_kcal	protein_g,iron_mg	high	lunch	solid	Rice, mixed dal, vegetable curry, ghee	Serve rice and dal with vegetable curry and a spoon of ghee for higher energy density.	35	https://www.youtube.com/watch?v=OFHxbbp-AYM	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
78	72	83	72-83-energy_kcal-02	Roti + Paneer Sabzi + Curd	veg	energy_kcal	protein_g,calcium_mg	high	dinner	solid	Roti, paneer sabzi, curd	Serve soft roti with paneer sabzi and curd for energy and calcium.	30	https://www.youtube.com/watch?v=GBz7SX74CuQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
79	72	83	72-83-protein_g-01	Egg Curry (soft) with Rice (if non-veg allowed)	non-veg	protein_g	iron_mg	high	lunch	solid	Eggs, mild spices, tomato gravy	Cook eggs in mild tomato gravy. Serve cut into small pieces with rice.	25	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
80	72	83	72-83-protein_g-02	Chickpea & Spinach Curry with Rice	veg	protein_g	iron_mg	high	dinner	solid	Chickpeas, spinach, mild spices	Soak chickpeas overnight, cook until soft, add spinach and simmer. Serve with rice.	50	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
81	72	83	72-83-carb_g-01	Vegetable Pulao with Nuts (soft pieces for kids)	veg	carb_g	energy_kcal	high	lunch	solid	Rice, vegetables, crushed nuts (small amount, optional), ghee	Cook rice with vegetables. Add crushed nuts paste (or omit if allergy). Serve warm.	30	https://www.youtube.com/watch?v=vZK3y9F7N0M	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
82	72	83	72-83-carb_g-02	Roti + Sweet Potato Mash	veg	carb_g	vitamin_a_mcg	medium	dinner	solid	Whole wheat roti, baked sweet potato mashed	Serve soft roti with mashed sweet potato mixed with a little ghee.	25	https://www.youtube.com/watch?v=nl0cCL82m-A	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
83	72	83	72-83-fat_g-01	Peanut Butter Sandwich (if no allergy)	veg	fat_g	energy_kcal	high	snack	solid	Whole wheat bread, smooth peanut butter, banana optional	Spread peanut butter thinly and add banana slices. Cut into small pieces for child.	5	https://www.youtube.com/watch?v=Qy7MZx8FZ2E	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
84	72	83	72-83-fat_g-02	Paneer Butter Masala (lighter version)	veg	fat_g	calcium_mg,protein_g	high	dinner	solid	Paneer, butter/ghee, mild gravy	Cook paneer in mild gravy with butter; serve in small portions.	30	https://www.youtube.com/watch?v=7MZQx3F8KpE	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
85	72	83	72-83-iron_mg-01	Spinach Dal with Rice	veg	iron_mg	protein_g	high	lunch	solid	Spinach puree, toor/moong dal, rice	Add spinach puree to cooked dal and simmer. Serve with rice.	30	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
86	72	83	72-83-iron_mg-02	Chole (soft) with Rice/soft roti	veg	iron_mg	protein_g	high	dinner	solid	Chickpeas (well cooked), mild spices	Soak chickpeas overnight; pressure cook until very soft. Serve with rice or soft roti.	50	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
87	72	83	72-83-calcium_mg-01	Paneer Curry with Vegetables	veg	calcium_mg	protein_g,energy_kcal	high	dinner	solid	Paneer, vegetables, mild gravy	Prepare paneer curry with minimal spices and serve with rice/roti.	30	https://www.youtube.com/watch?v=GBz7SX74CuQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
88	72	83	72-83-calcium_mg-02	Milkshake with Soaked Almond Paste (small amount)	veg	calcium_mg	fat_g	high	snack	semi-solid	Milk, banana, small amount almond paste	Blend milk and banana with a small amount of almond paste. Serve small portions.	5	https://www.youtube.com/watch?v=3MZKpF8QxY7	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
89	72	83	72-83-vitamin_a_mcg-01	Carrot & Tomato Stew (mild)	veg	vitamin_a_mcg	vitamin_c_mg	low	lunch	solid	Carrot, tomato, little oil/ghee	Cook vegetables till soft and serve mashed for kids.	25	https://www.youtube.com/watch?v=nl0cCL82m-A	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
90	72	83	72-83-vitamin_a_mcg-02	Sweet Potato & Carrot Roast	veg	vitamin_a_mcg	energy_kcal	medium	snack	solid	Sweet potato, carrot, little oil	Roast until soft; mash or cut into small pieces.	30	https://www.youtube.com/watch?v=KrxUJ34cE08	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
91	72	83	72-83-vitamin_c_mg-01	Citrus Fruit Salad (small pieces)	veg	vitamin_c_mg	fiber_g	low	snack	solid	Orange segments, papaya, kiwi (age-appropriate), plain yogurt	Cut fruit into small, soft pieces; mix with yogurt. Avoid kiwi for very young if allergy concern.	10	https://www.youtube.com/watch?v=tZ-SfxXMdUQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
92	72	83	72-83-vitamin_c_mg-02	Tomato & Capsicum Saute (mild)	veg	vitamin_c_mg	vitamin_a_mcg	low	lunch	solid	Tomato, capsicum, little oil	Cook peeled tomato with capsicum until soft; mash lightly for kids.	20	https://www.youtube.com/watch?v=nl0cCL82m-A	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
93	84	120	84-120-energy_kcal-01	Mixed Vegetable & Paneer Curry with Rice	veg	energy_kcal	protein_g,calcium_mg	high	lunch	solid	Rice, paneer, mixed vegetables, ghee	Cook rice; prepare paneer & veg curry. Add ghee for energy. Serve warm.	35	https://www.youtube.com/watch?v=vZK3y9F7N0M	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
94	84	120	84-120-energy_kcal-02	Chickpea Curry (chole) with Soft Roti	veg	energy_kcal	protein_g,iron_mg	high	dinner	solid	Chickpeas, onions, tomato, mild spices	Soak chickpeas overnight; cook until soft. Prepare mild gravy and serve with roti.	50	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
95	84	120	84-120-protein_g-01	Paneer & Peas Curry + Roti	veg	protein_g	calcium_mg	high	dinner	solid	Paneer, peas, mild tomato gravy	Cook paneer with peas in mild gravy; serve with soft roti.	25	https://www.youtube.com/watch?v=GBz7SX74CuQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
96	84	120	84-120-protein_g-02	Egg Curry with Rice (if non-veg allowed)	non-veg	protein_g	iron_mg	high	lunch	solid	Eggs, tomato-onion gravy, rice	Prepare eggs in mild curry and serve with rice. Cut into small pieces for child.	25	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
97	84	120	84-120-carb_g-01	Vegetable Pulao	veg	carb_g	energy_kcal	medium	lunch	solid	Rice, vegetables, ghee	Cook rice with vegetables and serve warm.	25	https://www.youtube.com/watch?v=vZK3y9F7N0M	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
98	84	120	84-120-carb_g-02	Roti + Potato & Peas Sabzi	veg	carb_g	fiber_g,vitamin_c_mg	medium	dinner	solid	Whole wheat roti, potato, peas	Serve soft roti with potato-peas sabzi; ensure soft textures for kids.	25	https://www.youtube.com/watch?v=97kCezePyy0	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
99	84	120	84-120-fat_g-01	Peanut Butter Banana Sandwich (no whole nuts)	veg	fat_g	energy_kcal	high	snack	solid	Whole wheat bread, smooth peanut butter, banana	Spread peanut butter thinly, add banana slices, cut to small pieces. Watch for allergies.	5	https://www.youtube.com/watch?v=Qy7MZx8FZ2E	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
100	84	120	84-120-fat_g-02	Paneer Butter Masala (mild)	veg	fat_g	calcium_mg	high	dinner	solid	Paneer, butter, mild gravy	Cook paneer in mild gravy with butter and serve warm.	30	https://www.youtube.com/watch?v=7MZQx3F8KpE	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
101	84	120	84-120-iron_mg-01	Chole (soft) with Rice	veg	iron_mg	protein_g	medium	lunch	solid	Chickpeas, tomato, spices (mild)	Soak chickpeas overnight; pressure cook until soft. Serve with rice.	60	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
102	84	120	84-120-iron_mg-02	Spinach & Dal (soft) with Rice	veg	iron_mg	protein_g	medium	dinner	solid	Spinach, dal, rice	Cook dal and add spinach puree; simmer and serve with rice.	30	https://www.youtube.com/watch?v=kKjX0iWAxXw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
103	84	120	84-120-calcium_mg-01	Paneer Curry + Rice	veg	calcium_mg	protein_g	medium	dinner	solid	Paneer, mild gravy, rice	Cook paneer in mild gravy and serve with rice.	30	https://www.youtube.com/watch?v=GBz7SX74CuQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
104	84	120	84-120-calcium_mg-02	Milk + Ragi or Oats Porridge (evening)	veg	calcium_mg	energy_kcal	medium	snack	semi-solid	Milk, ragi/oats, jaggery optional	Cook ragi or oats in milk; add jaggery lightly for taste; serve lukewarm.	12	https://www.youtube.com/watch?v=p_GUQfNpRpw	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
105	84	120	84-120-vitamin_a_mcg-01	Mixed Vegetable Curry with Carrot & Pumpkin	veg	vitamin_a_mcg	vitamin_c_mg	low	lunch	solid	Carrot, pumpkin, other vegetables, little oil/ghee	Cook vegetables until soft, serve in small bite-sized pieces.	30	https://www.youtube.com/watch?v=nl0cCL82m-A	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
106	84	120	84-120-vitamin_a_mcg-02	Sweet Potato Fries (oven-baked soft)	veg	vitamin_a_mcg	energy_kcal	medium	snack	solid	Sweet potato, little oil, mild seasoning	Bake soft sweet potato sticks until tender; serve slightly mashed for younger kids.	30	https://www.youtube.com/watch?v=KrxUJ34cE08	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
107	84	120	84-120-vitamin_c_mg-01	Fruit Smoothie (mixed citrus & papaya)	veg	vitamin_c_mg	energy_kcal	low	snack	semi-solid	Orange, papaya, banana, yogurt	Blend fruits with yogurt for a vitamin-rich smoothie. Serve chilled but not too cold.	5	https://www.youtube.com/watch?v=tZ-SfxXMdUQ	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
108	84	120	84-120-vitamin_c_mg-02	Tomato & Capsicum Curry (mild)	veg	vitamin_c_mg	vitamin_a_mcg	low	lunch	solid	Tomato, capsicum, mild spices	Cook peeled tomatoes with capsicum until soft; serve mashed or bite-sized.	20	https://www.youtube.com/watch?v=nl0cCL82m-A	2025-12-18 14:49:10.889247	2025-12-18 14:49:10.889247
\.


--
-- TOC entry 5885 (class 0 OID 29510)
-- Dependencies: 246
-- Data for Name: nutrition_requirement; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.nutrition_requirement (id, age_min_months, age_max_months, energy_kcal, protein_g, carb_g, fat_g, iron_mg, calcium_mg, vitamin_a_mcg, vitamin_c_mg) FROM stdin;
7	0	5	550	9.1	0	31	0.27	200	400	40
8	6	11	700	11	0	30	11	260	500	50
9	12	23	900	11	120	30	7	500	300	20
10	24	35	1000	13	130	30	7	600	300	20
11	36	47	1200	16	140	32	9	600	350	25
12	48	71	1350	20	150	35	10	650	400	25
13	72	83	1550	24	165	38	11	700	500	30
14	84	120	1700	29	180	40	12	800	600	30
\.


--
-- TOC entry 5955 (class 0 OID 33620)
-- Dependencies: 316
-- Data for Name: parent_profile_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parent_profile_photos (id, parent_id, photo_url, mime_type, file_size, created_at, updated_at) FROM stdin;
1	1	parents/1/profile.jpg	image/jpeg	1163283	2026-02-02 18:27:13.464401	2026-02-02 18:45:08.423986
\.


--
-- TOC entry 5887 (class 0 OID 29525)
-- Dependencies: 248
-- Data for Name: parents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parents (parent_id, full_name, email, phone_number, password_hash, is_active, created_at, updated_at) FROM stdin;
1	Ashwin Solanki	ashwinsolanki9898@gmail.com	8128839609	$2b$12$c8uGV86MKndtQv.O6AS5WOATIM482PTROqcmIxex3r0S3haYDrGiy	t	2025-11-02 14:44:06.780234	2025-11-02 14:44:06.780234
\.


--
-- TOC entry 5898 (class 0 OID 32452)
-- Dependencies: 259
-- Data for Name: places; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.places (id, name, type, is_verified, created_by_doctor, created_at, address_id, official_phone) FROM stdin;
1	Techsentinals child clinic	CLINIC	t	2	2026-01-26 14:50:33.231495	1	8128839609
\.


--
-- TOC entry 5914 (class 0 OID 32794)
-- Dependencies: 275
-- Data for Name: queue_access_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queue_access_assignments (id, place_id, queue_id, actor_type, actor_id, access_date, can_view, can_work, assigned_by, created_at) FROM stdin;
\.


--
-- TOC entry 5921 (class 0 OID 32954)
-- Dependencies: 282
-- Data for Name: queue_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queue_assignments (id, queue_item_id, assigned_to_type, assigned_to_id, assigned_at, released_at) FROM stdin;
\.


--
-- TOC entry 5916 (class 0 OID 32868)
-- Dependencies: 277
-- Data for Name: queue_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queue_items (id, queue_id, child_id, entry_type, state, priority, appointment_time, checked_in_at, appointment_id, created_at) FROM stdin;
\.


--
-- TOC entry 5908 (class 0 OID 32682)
-- Dependencies: 269
-- Data for Name: queues; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.queues (id, place_id, queue_date, status, closed_reason, closed_by, closed_at) FROM stdin;
\.


--
-- TOC entry 5910 (class 0 OID 32710)
-- Dependencies: 271
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff (id, place_id, full_name, role, phone, is_active, created_by_doctor, created_at) FROM stdin;
\.


--
-- TOC entry 5917 (class 0 OID 32899)
-- Dependencies: 278
-- Data for Name: staff_auth; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_auth (staff_id, password_hash) FROM stdin;
\.


--
-- TOC entry 5919 (class 0 OID 32930)
-- Dependencies: 280
-- Data for Name: staff_availability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staff_availability (id, staff_id, day_of_week, start_time, end_time, is_active) FROM stdin;
\.


--
-- TOC entry 5889 (class 0 OID 29542)
-- Dependencies: 250
-- Data for Name: vaccination_schedule; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vaccination_schedule (id, vaccine_name, disease_prevented, recommended_age, doses_required, category, age_group, created_at, updated_at) FROM stdin;
35	BCG	Tuberculosis	At birth	1	CORE	INFANT	2025-11-02 14:56:15.46117	2025-11-02 14:56:15.46117
36	OPV - 0 dose	Poliomyelitis	At birth	1	CORE	INFANT	2025-11-02 14:56:15.494142	2025-11-02 14:56:15.494142
37	Hepatitis B - Birth Dose	Hepatitis B infection	At birth (within 24 hrs)	1	CORE	INFANT	2025-11-02 14:56:15.503295	2025-11-02 14:56:15.503295
38	Pentavalent Vaccine (DTP + Hib + Hep B)	Diphtheria, Tetanus, Pertussis, Hib, Hepatitis B	6, 10, 14 weeks	3	CORE	INFANT	2025-11-02 14:56:15.512407	2025-11-02 14:56:15.512407
39	OPV - 1,2,3	Poliomyelitis	6, 10, 14 weeks	3	CORE	INFANT	2025-11-02 14:56:15.521318	2025-11-02 14:56:15.521318
40	Rotavirus Vaccine	Rotavirus diarrhea	6, 10, 14 weeks	3	OPTIONAL	INFANT	2025-11-02 14:56:15.530809	2025-11-02 14:56:15.530809
41	IPV	Poliomyelitis	14 weeks	1	CORE	INFANT	2025-11-02 14:56:15.541483	2025-11-02 14:56:15.541483
42	PCV	Pneumococcal infection	6, 14 weeks	2	OPTIONAL	INFANT	2025-11-02 14:56:15.55085	2025-11-02 14:56:15.55085
43	Influenza Vaccine	Influenza (flu)	6 months onward (yearly)	1	OPTIONAL	INFANT	2025-11-02 14:56:15.559765	2025-11-02 14:56:15.559765
44	MR Vaccine - 1st dose	Measles, Rubella	9 months	1	CORE	INFANT	2025-11-02 14:56:15.569221	2025-11-02 14:56:15.569221
45	JE Vaccine	Japanese Encephalitis	9 months (endemic areas)	1	REGIONAL	INFANT	2025-11-02 14:56:15.5762	2025-11-02 14:56:15.5762
46	Vitamin A Supplementation	Prevents deficiency & eye disorders	9 months	1	SUPPLEMENTAL	INFANT	2025-11-02 14:56:15.583279	2025-11-02 14:56:15.583279
51	PCV Booster	Pneumococcal infection	15 months	1	OPTIONAL	TODDLER	2025-11-02 14:56:15.616295	2025-11-02 14:56:15.616295
52	Varicella - 1st dose	Chickenpox	15 months	1	OPTIONAL	TODDLER	2025-11-02 14:56:15.624136	2025-11-02 14:56:15.624136
54	Influenza Vaccine	Influenza (flu)	Every year	1	OPTIONAL	TODDLER	2025-11-02 14:56:15.638744	2025-11-02 14:56:15.638744
55	Vitamin A Supplementation	Vitamin A deficiency	Every 6 months until 5 years	6	SUPPLEMENTAL	TODDLER	2025-11-02 14:56:15.645402	2025-11-02 14:56:15.645402
60	Typhoid Conjugate Vaccine	Typhoid fever	2 years onward (single dose)	1	OPTIONAL	PRESCHOOL	2025-11-02 14:56:15.678633	2025-11-02 14:56:15.678633
62	Influenza Vaccine	Influenza (flu)	Every year	1	OPTIONAL	PRESCHOOL	2025-11-02 14:56:15.692071	2025-11-02 14:56:15.692071
63	Vitamin A Supplementation	Prevent deficiency	Every 6 months until 5 years	4	SUPPLEMENTAL	PRESCHOOL	2025-11-02 14:56:15.69881	2025-11-02 14:56:15.69881
65	Influenza Vaccine	Influenza (flu)	Every year	1	OPTIONAL	SCHOOL_AGE	2025-11-02 14:56:15.712491	2025-11-02 14:56:15.712491
66	Td / DT Booster	Tetanus and Diphtheria	10 years	1	CORE	SCHOOL_AGE	2025-11-02 14:56:15.719141	2025-11-02 14:56:15.719141
68	Vitamin A Supplementation	Nutritional support	Continue if under 10 years	2	SUPPLEMENTAL	SCHOOL_AGE	2025-11-02 14:56:15.732321	2025-11-02 14:56:15.732321
47	MR Vaccine - 2nd dose	Measles, Rubella	15-18 months	1	CORE	TODDLER	2025-11-02 14:56:15.589914	2025-11-02 15:02:26.107899
48	DTP Booster - 1	Diphtheria, Tetanus, Pertussis	15-18 months	1	CORE	TODDLER	2025-11-02 14:56:15.596267	2025-11-02 15:02:26.107899
49	OPV Booster	Poliomyelitis	15-18 months	1	CORE	TODDLER	2025-11-02 14:56:15.602855	2025-11-02 15:02:26.107899
50	IPV Booster	Poliomyelitis	15-18 months	1	CORE	TODDLER	2025-11-02 14:56:15.609108	2025-11-02 15:02:26.107899
53	Hepatitis A - 1st dose	Hepatitis A	12-23 months	1	OPTIONAL	TODDLER	2025-11-02 14:56:15.632334	2025-11-02 15:02:26.107899
56	DTP Booster - 2	Diphtheria, Tetanus, Pertussis	4-6 years	1	CORE	PRESCHOOL	2025-11-02 14:56:15.651932	2025-11-02 15:02:26.107899
57	OPV Booster	Poliomyelitis	4-6 years	1	CORE	PRESCHOOL	2025-11-02 14:56:15.658752	2025-11-02 15:02:26.107899
58	Varicella - 2nd dose	Chickenpox	4-6 years	1	OPTIONAL	PRESCHOOL	2025-11-02 14:56:15.665442	2025-11-02 15:02:26.107899
59	MMR Booster	Measles, Mumps, Rubella	4-6 years	1	CORE	PRESCHOOL	2025-11-02 14:56:15.672018	2025-11-02 15:02:26.107899
61	Hepatitis A - 2nd dose	Hepatitis A	6-18 months after 1st dose	1	OPTIONAL	PRESCHOOL	2025-11-02 14:56:15.685193	2025-11-02 15:02:26.107899
64	Typhoid Booster	Typhoid fever	6-10 years	1	OPTIONAL	SCHOOL_AGE	2025-11-02 14:56:15.705833	2025-11-02 15:02:26.107899
67	HPV Vaccine	Human Papillomavirus (Cervical cancer prevention)	9-10 years	2	OPTIONAL	SCHOOL_AGE	2025-11-02 14:56:15.725601	2025-11-02 15:02:26.107899
\.


--
-- TOC entry 5925 (class 0 OID 33042)
-- Dependencies: 286
-- Data for Name: visit_advice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_advice (id, visit_id, doctor_id, advice_text, advice_category, created_at) FROM stdin;
\.


--
-- TOC entry 5926 (class 0 OID 33069)
-- Dependencies: 287
-- Data for Name: visit_clinical_summary; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_clinical_summary (visit_id, has_vitals, has_symptoms, has_diagnosis, has_prescription, has_advice, has_followup, has_referral, has_documents) FROM stdin;
\.


--
-- TOC entry 5928 (class 0 OID 33104)
-- Dependencies: 289
-- Data for Name: visit_diagnoses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_diagnoses (id, visit_id, doctor_id, diagnosis_text, diagnosis_code, diagnosis_type, created_at) FROM stdin;
\.


--
-- TOC entry 5930 (class 0 OID 33138)
-- Dependencies: 291
-- Data for Name: visit_doctors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_doctors (id, visit_id, doctor_id, role, assigned_at, released_at) FROM stdin;
\.


--
-- TOC entry 5932 (class 0 OID 33184)
-- Dependencies: 293
-- Data for Name: visit_documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_documents (id, visit_id, child_id, document_type, file_name, file_url, mime_type, uploaded_by_type, uploaded_by_id, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5934 (class 0 OID 33218)
-- Dependencies: 295
-- Data for Name: visit_followups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_followups (id, visit_id, doctor_id, follow_up_required, follow_up_type, follow_up_date, follow_up_notes, created_at) FROM stdin;
\.


--
-- TOC entry 5944 (class 0 OID 33410)
-- Dependencies: 305
-- Data for Name: visit_injections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_injections (id, prescription_item_id, drug_source, medicine_id, custom_drug_id, route, site, dose_value, dose_unit, administered_by, administered_at, instructions) FROM stdin;
\.


--
-- TOC entry 5951 (class 0 OID 33565)
-- Dependencies: 312
-- Data for Name: visit_medicine_timing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_medicine_timing (medicine_id, morning, afternoon, evening, night, dose_quantity) FROM stdin;
\.


--
-- TOC entry 5946 (class 0 OID 33478)
-- Dependencies: 307
-- Data for Name: visit_medicines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_medicines (id, prescription_item_id, drug_source, medicine_id, custom_drug_id, dosage_form, route, duration_days, meal_relation, is_prn, instructions) FROM stdin;
\.


--
-- TOC entry 5936 (class 0 OID 33258)
-- Dependencies: 297
-- Data for Name: visit_prescription_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_prescription_items (id, visit_id, doctor_id, item_type, notes, created_at) FROM stdin;
\.


--
-- TOC entry 5948 (class 0 OID 33518)
-- Dependencies: 309
-- Data for Name: visit_procedures; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_procedures (id, prescription_item_id, procedure_name, procedure_type, frequency_per_day, duration_days, instructions) FROM stdin;
\.


--
-- TOC entry 5938 (class 0 OID 33292)
-- Dependencies: 299
-- Data for Name: visit_referrals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_referrals (id, visit_id, doctor_id, referred_to_name, referred_to_specialization, referred_to_place, reason, urgency, created_at) FROM stdin;
\.


--
-- TOC entry 5940 (class 0 OID 33332)
-- Dependencies: 301
-- Data for Name: visit_symptoms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_symptoms (id, visit_id, symptom_name, duration_days, severity, recorded_by_type, recorded_by_id, created_at) FROM stdin;
\.


--
-- TOC entry 5950 (class 0 OID 33546)
-- Dependencies: 311
-- Data for Name: visit_vaccines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_vaccines (id, prescription_item_id, vaccine_name, brand_name, dose_number, route, site, next_due_date, administered_at) FROM stdin;
\.


--
-- TOC entry 5942 (class 0 OID 33358)
-- Dependencies: 303
-- Data for Name: visit_vitals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visit_vitals (id, visit_id, weight_kg, height_cm, head_circumference_cm, muac_cm, temperature_c, heart_rate, respiratory_rate, spo2, entered_by_type, entered_by_id, measured_at) FROM stdin;
\.


--
-- TOC entry 5923 (class 0 OID 32992)
-- Dependencies: 284
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.visits (id, child_id, place_id, queue_item_id, appointment_id, visit_type, status, started_at, ended_at, created_at) FROM stdin;
\.


--
-- TOC entry 6012 (class 0 OID 0)
-- Dependencies: 313
-- Name: addresses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.addresses_id_seq', 1, true);


--
-- TOC entry 6013 (class 0 OID 0)
-- Dependencies: 260
-- Name: appointments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.appointments_id_seq', 1, false);


--
-- TOC entry 6014 (class 0 OID 0)
-- Dependencies: 221
-- Name: child_anthropometry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_anthropometry_id_seq', 4, true);


--
-- TOC entry 6015 (class 0 OID 0)
-- Dependencies: 223
-- Name: child_illness_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_illness_logs_id_seq', 20, true);


--
-- TOC entry 6016 (class 0 OID 0)
-- Dependencies: 225
-- Name: child_meal_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_meal_item_id_seq', 51, true);


--
-- TOC entry 6017 (class 0 OID 0)
-- Dependencies: 227
-- Name: child_meal_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_meal_log_id_seq', 13, true);


--
-- TOC entry 6018 (class 0 OID 0)
-- Dependencies: 229
-- Name: child_medical_reports_report_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_medical_reports_report_id_seq', 3, true);


--
-- TOC entry 6019 (class 0 OID 0)
-- Dependencies: 231
-- Name: child_milestone_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_milestone_status_id_seq', 17, true);


--
-- TOC entry 6020 (class 0 OID 0)
-- Dependencies: 233
-- Name: child_milestones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_milestones_id_seq', 9, true);


--
-- TOC entry 6021 (class 0 OID 0)
-- Dependencies: 235
-- Name: child_prediction_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_prediction_reports_id_seq', 17, true);


--
-- TOC entry 6022 (class 0 OID 0)
-- Dependencies: 317
-- Name: child_profile_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_profile_photos_id_seq', 1, true);


--
-- TOC entry 6023 (class 0 OID 0)
-- Dependencies: 237
-- Name: child_vaccine_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.child_vaccine_status_id_seq', 47, true);


--
-- TOC entry 6024 (class 0 OID 0)
-- Dependencies: 239
-- Name: children_child_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.children_child_id_seq', 3, true);


--
-- TOC entry 6025 (class 0 OID 0)
-- Dependencies: 262
-- Name: custom_doctor_drug_salts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.custom_doctor_drug_salts_id_seq', 1, false);


--
-- TOC entry 6026 (class 0 OID 0)
-- Dependencies: 252
-- Name: custom_doctor_drugs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.custom_doctor_drugs_id_seq', 1, false);


--
-- TOC entry 6027 (class 0 OID 0)
-- Dependencies: 264
-- Name: doctor_availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_availability_id_seq', 1, false);


--
-- TOC entry 6028 (class 0 OID 0)
-- Dependencies: 272
-- Name: doctor_place_role_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_place_role_documents_id_seq', 6, true);


--
-- TOC entry 6029 (class 0 OID 0)
-- Dependencies: 266
-- Name: doctor_place_roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_place_roles_id_seq', 2, true);


--
-- TOC entry 6030 (class 0 OID 0)
-- Dependencies: 256
-- Name: doctor_verification_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctor_verification_documents_id_seq', 4, true);


--
-- TOC entry 6031 (class 0 OID 0)
-- Dependencies: 241
-- Name: doctors_doctor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.doctors_doctor_id_seq', 3, true);


--
-- TOC entry 6032 (class 0 OID 0)
-- Dependencies: 243
-- Name: food_master_food_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.food_master_food_id_seq', 28, true);


--
-- TOC entry 6033 (class 0 OID 0)
-- Dependencies: 245
-- Name: nutrition_recipe_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nutrition_recipe_id_seq', 108, true);


--
-- TOC entry 6034 (class 0 OID 0)
-- Dependencies: 247
-- Name: nutrition_requirement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.nutrition_requirement_id_seq', 14, true);


--
-- TOC entry 6035 (class 0 OID 0)
-- Dependencies: 315
-- Name: parent_profile_photos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parent_profile_photos_id_seq', 1, true);


--
-- TOC entry 6036 (class 0 OID 0)
-- Dependencies: 249
-- Name: parents_parent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.parents_parent_id_seq', 1, true);


--
-- TOC entry 6037 (class 0 OID 0)
-- Dependencies: 258
-- Name: places_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.places_id_seq', 1, true);


--
-- TOC entry 6038 (class 0 OID 0)
-- Dependencies: 274
-- Name: queue_access_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.queue_access_assignments_id_seq', 1, false);


--
-- TOC entry 6039 (class 0 OID 0)
-- Dependencies: 281
-- Name: queue_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.queue_assignments_id_seq', 1, false);


--
-- TOC entry 6040 (class 0 OID 0)
-- Dependencies: 276
-- Name: queue_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.queue_items_id_seq', 1, false);


--
-- TOC entry 6041 (class 0 OID 0)
-- Dependencies: 268
-- Name: queues_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.queues_id_seq', 1, false);


--
-- TOC entry 6042 (class 0 OID 0)
-- Dependencies: 279
-- Name: staff_availability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_availability_id_seq', 1, false);


--
-- TOC entry 6043 (class 0 OID 0)
-- Dependencies: 270
-- Name: staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.staff_id_seq', 1, false);


--
-- TOC entry 6044 (class 0 OID 0)
-- Dependencies: 251
-- Name: vaccination_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vaccination_schedule_id_seq', 68, true);


--
-- TOC entry 6045 (class 0 OID 0)
-- Dependencies: 285
-- Name: visit_advice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_advice_id_seq', 1, false);


--
-- TOC entry 6046 (class 0 OID 0)
-- Dependencies: 288
-- Name: visit_diagnoses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_diagnoses_id_seq', 1, false);


--
-- TOC entry 6047 (class 0 OID 0)
-- Dependencies: 290
-- Name: visit_doctors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_doctors_id_seq', 1, false);


--
-- TOC entry 6048 (class 0 OID 0)
-- Dependencies: 292
-- Name: visit_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_documents_id_seq', 1, false);


--
-- TOC entry 6049 (class 0 OID 0)
-- Dependencies: 294
-- Name: visit_followups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_followups_id_seq', 1, false);


--
-- TOC entry 6050 (class 0 OID 0)
-- Dependencies: 304
-- Name: visit_injections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_injections_id_seq', 1, false);


--
-- TOC entry 6051 (class 0 OID 0)
-- Dependencies: 306
-- Name: visit_medicines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_medicines_id_seq', 1, false);


--
-- TOC entry 6052 (class 0 OID 0)
-- Dependencies: 296
-- Name: visit_prescription_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_prescription_items_id_seq', 1, false);


--
-- TOC entry 6053 (class 0 OID 0)
-- Dependencies: 308
-- Name: visit_procedures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_procedures_id_seq', 1, false);


--
-- TOC entry 6054 (class 0 OID 0)
-- Dependencies: 298
-- Name: visit_referrals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_referrals_id_seq', 1, false);


--
-- TOC entry 6055 (class 0 OID 0)
-- Dependencies: 300
-- Name: visit_symptoms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_symptoms_id_seq', 1, false);


--
-- TOC entry 6056 (class 0 OID 0)
-- Dependencies: 310
-- Name: visit_vaccines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_vaccines_id_seq', 1, false);


--
-- TOC entry 6057 (class 0 OID 0)
-- Dependencies: 302
-- Name: visit_vitals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visit_vitals_id_seq', 1, false);


--
-- TOC entry 6058 (class 0 OID 0)
-- Dependencies: 283
-- Name: visits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.visits_id_seq', 1, false);


--
-- TOC entry 5625 (class 2606 OID 33609)
-- Name: addresses addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);


--
-- TOC entry 5441 (class 2606 OID 29574)
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- TOC entry 5535 (class 2606 OID 32525)
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- TOC entry 5443 (class 2606 OID 29576)
-- Name: child_anthropometry child_anthropometry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_anthropometry
    ADD CONSTRAINT child_anthropometry_pkey PRIMARY KEY (id);


--
-- TOC entry 5447 (class 2606 OID 29578)
-- Name: child_illness_logs child_illness_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_illness_logs
    ADD CONSTRAINT child_illness_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5451 (class 2606 OID 29580)
-- Name: child_meal_item child_meal_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_meal_item
    ADD CONSTRAINT child_meal_item_pkey PRIMARY KEY (id);


--
-- TOC entry 5456 (class 2606 OID 29582)
-- Name: child_meal_log child_meal_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_meal_log
    ADD CONSTRAINT child_meal_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5460 (class 2606 OID 29584)
-- Name: child_medical_reports child_medical_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_medical_reports
    ADD CONSTRAINT child_medical_reports_pkey PRIMARY KEY (report_id);


--
-- TOC entry 5465 (class 2606 OID 29586)
-- Name: child_milestone_status child_milestone_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_milestone_status
    ADD CONSTRAINT child_milestone_status_pkey PRIMARY KEY (id);


--
-- TOC entry 5472 (class 2606 OID 29588)
-- Name: child_milestones child_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_milestones
    ADD CONSTRAINT child_milestones_pkey PRIMARY KEY (id);


--
-- TOC entry 5477 (class 2606 OID 29590)
-- Name: child_prediction_reports child_prediction_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_prediction_reports
    ADD CONSTRAINT child_prediction_reports_pkey PRIMARY KEY (id);


--
-- TOC entry 5636 (class 2606 OID 33657)
-- Name: child_profile_photos child_profile_photos_child_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profile_photos
    ADD CONSTRAINT child_profile_photos_child_id_key UNIQUE (child_id);


--
-- TOC entry 5638 (class 2606 OID 33655)
-- Name: child_profile_photos child_profile_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profile_photos
    ADD CONSTRAINT child_profile_photos_pkey PRIMARY KEY (id);


--
-- TOC entry 5482 (class 2606 OID 29592)
-- Name: child_vaccine_status child_vaccine_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_vaccine_status
    ADD CONSTRAINT child_vaccine_status_pkey PRIMARY KEY (id);


--
-- TOC entry 5487 (class 2606 OID 29594)
-- Name: children children_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT children_pkey PRIMARY KEY (child_id);


--
-- TOC entry 5538 (class 2606 OID 32566)
-- Name: custom_doctor_drug_salts custom_doctor_drug_salts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_doctor_drug_salts
    ADD CONSTRAINT custom_doctor_drug_salts_pkey PRIMARY KEY (id);


--
-- TOC entry 5520 (class 2606 OID 32352)
-- Name: custom_doctor_drugs custom_doctor_drugs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_doctor_drugs
    ADD CONSTRAINT custom_doctor_drugs_pkey PRIMARY KEY (id);


--
-- TOC entry 5523 (class 2606 OID 32367)
-- Name: doctor_auth doctor_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_auth
    ADD CONSTRAINT doctor_auth_pkey PRIMARY KEY (doctor_id);


--
-- TOC entry 5541 (class 2606 OID 32601)
-- Name: doctor_availability doctor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_pkey PRIMARY KEY (id);


--
-- TOC entry 5555 (class 2606 OID 32780)
-- Name: doctor_place_role_documents doctor_place_role_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_place_role_documents
    ADD CONSTRAINT doctor_place_role_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 5544 (class 2606 OID 32647)
-- Name: doctor_place_roles doctor_place_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_place_roles
    ADD CONSTRAINT doctor_place_roles_pkey PRIMARY KEY (id);


--
-- TOC entry 5526 (class 2606 OID 32395)
-- Name: doctor_status doctor_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_status
    ADD CONSTRAINT doctor_status_pkey PRIMARY KEY (doctor_id);


--
-- TOC entry 5529 (class 2606 OID 32436)
-- Name: doctor_verification_documents doctor_verification_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_verification_documents
    ADD CONSTRAINT doctor_verification_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 5491 (class 2606 OID 29596)
-- Name: doctors doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctors
    ADD CONSTRAINT doctors_pkey PRIMARY KEY (doctor_id);


--
-- TOC entry 5496 (class 2606 OID 29598)
-- Name: food_master food_master_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.food_master
    ADD CONSTRAINT food_master_pkey PRIMARY KEY (food_id);


--
-- TOC entry 5505 (class 2606 OID 29600)
-- Name: nutrition_recipe nutrition_recipe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrition_recipe
    ADD CONSTRAINT nutrition_recipe_pkey PRIMARY KEY (id);


--
-- TOC entry 5508 (class 2606 OID 29602)
-- Name: nutrition_requirement nutrition_requirement_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.nutrition_requirement
    ADD CONSTRAINT nutrition_requirement_pkey PRIMARY KEY (id);


--
-- TOC entry 5632 (class 2606 OID 33634)
-- Name: parent_profile_photos parent_profile_photos_parent_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_profile_photos
    ADD CONSTRAINT parent_profile_photos_parent_id_key UNIQUE (parent_id);


--
-- TOC entry 5634 (class 2606 OID 33632)
-- Name: parent_profile_photos parent_profile_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_profile_photos
    ADD CONSTRAINT parent_profile_photos_pkey PRIMARY KEY (id);


--
-- TOC entry 5513 (class 2606 OID 29604)
-- Name: parents parents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_pkey PRIMARY KEY (parent_id);


--
-- TOC entry 5533 (class 2606 OID 32464)
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- TOC entry 5559 (class 2606 OID 32811)
-- Name: queue_access_assignments queue_access_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_access_assignments
    ADD CONSTRAINT queue_access_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 5571 (class 2606 OID 32965)
-- Name: queue_assignments queue_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_assignments
    ADD CONSTRAINT queue_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 5562 (class 2606 OID 32882)
-- Name: queue_items queue_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_items
    ADD CONSTRAINT queue_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5548 (class 2606 OID 32692)
-- Name: queues queues_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_pkey PRIMARY KEY (id);


--
-- TOC entry 5565 (class 2606 OID 32906)
-- Name: staff_auth staff_auth_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_auth
    ADD CONSTRAINT staff_auth_pkey PRIMARY KEY (staff_id);


--
-- TOC entry 5568 (class 2606 OID 32940)
-- Name: staff_availability staff_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_availability
    ADD CONSTRAINT staff_availability_pkey PRIMARY KEY (id);


--
-- TOC entry 5553 (class 2606 OID 32722)
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- TOC entry 5628 (class 2606 OID 33611)
-- Name: addresses uq_address_basic; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addresses
    ADD CONSTRAINT uq_address_basic UNIQUE (line1, city, pincode);


--
-- TOC entry 5470 (class 2606 OID 29606)
-- Name: child_milestone_status uq_child_milestone_status_child_milestone; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_milestone_status
    ADD CONSTRAINT uq_child_milestone_status_child_milestone UNIQUE (child_id, milestone_id);


--
-- TOC entry 5550 (class 2606 OID 32694)
-- Name: queues uq_place_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT uq_place_date UNIQUE (place_id, queue_date);


--
-- TOC entry 5586 (class 2606 OID 33152)
-- Name: visit_doctors uq_visit_doctor; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_doctors
    ADD CONSTRAINT uq_visit_doctor UNIQUE (visit_id, doctor_id);


--
-- TOC entry 5594 (class 2606 OID 33234)
-- Name: visit_followups uq_visit_followup_visit; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_followups
    ADD CONSTRAINT uq_visit_followup_visit UNIQUE (visit_id);


--
-- TOC entry 5518 (class 2606 OID 29608)
-- Name: vaccination_schedule vaccination_schedule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vaccination_schedule
    ADD CONSTRAINT vaccination_schedule_pkey PRIMARY KEY (id);


--
-- TOC entry 5577 (class 2606 OID 33057)
-- Name: visit_advice visit_advice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_advice
    ADD CONSTRAINT visit_advice_pkey PRIMARY KEY (id);


--
-- TOC entry 5580 (class 2606 OID 33090)
-- Name: visit_clinical_summary visit_clinical_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_clinical_summary
    ADD CONSTRAINT visit_clinical_summary_pkey PRIMARY KEY (visit_id);


--
-- TOC entry 5583 (class 2606 OID 33117)
-- Name: visit_diagnoses visit_diagnoses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_diagnoses
    ADD CONSTRAINT visit_diagnoses_pkey PRIMARY KEY (id);


--
-- TOC entry 5588 (class 2606 OID 33150)
-- Name: visit_doctors visit_doctors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_doctors
    ADD CONSTRAINT visit_doctors_pkey PRIMARY KEY (id);


--
-- TOC entry 5591 (class 2606 OID 33196)
-- Name: visit_documents visit_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_documents
    ADD CONSTRAINT visit_documents_pkey PRIMARY KEY (id);


--
-- TOC entry 5596 (class 2606 OID 33232)
-- Name: visit_followups visit_followups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_followups
    ADD CONSTRAINT visit_followups_pkey PRIMARY KEY (id);


--
-- TOC entry 5611 (class 2606 OID 33421)
-- Name: visit_injections visit_injections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_injections
    ADD CONSTRAINT visit_injections_pkey PRIMARY KEY (id);


--
-- TOC entry 5623 (class 2606 OID 33579)
-- Name: visit_medicine_timing visit_medicine_timing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_medicine_timing
    ADD CONSTRAINT visit_medicine_timing_pkey PRIMARY KEY (medicine_id);


--
-- TOC entry 5614 (class 2606 OID 33495)
-- Name: visit_medicines visit_medicines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_medicines
    ADD CONSTRAINT visit_medicines_pkey PRIMARY KEY (id);


--
-- TOC entry 5599 (class 2606 OID 33271)
-- Name: visit_prescription_items visit_prescription_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_prescription_items
    ADD CONSTRAINT visit_prescription_items_pkey PRIMARY KEY (id);


--
-- TOC entry 5617 (class 2606 OID 33529)
-- Name: visit_procedures visit_procedures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_procedures
    ADD CONSTRAINT visit_procedures_pkey PRIMARY KEY (id);


--
-- TOC entry 5602 (class 2606 OID 33306)
-- Name: visit_referrals visit_referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_referrals
    ADD CONSTRAINT visit_referrals_pkey PRIMARY KEY (id);


--
-- TOC entry 5605 (class 2606 OID 33343)
-- Name: visit_symptoms visit_symptoms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_symptoms
    ADD CONSTRAINT visit_symptoms_pkey PRIMARY KEY (id);


--
-- TOC entry 5620 (class 2606 OID 33558)
-- Name: visit_vaccines visit_vaccines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_vaccines
    ADD CONSTRAINT visit_vaccines_pkey PRIMARY KEY (id);


--
-- TOC entry 5608 (class 2606 OID 33368)
-- Name: visit_vitals visit_vitals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_vitals
    ADD CONSTRAINT visit_vitals_pkey PRIMARY KEY (id);


--
-- TOC entry 5574 (class 2606 OID 33005)
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- TOC entry 5626 (class 1259 OID 33612)
-- Name: ix_addresses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_addresses_id ON public.addresses USING btree (id);


--
-- TOC entry 5536 (class 1259 OID 32541)
-- Name: ix_appointments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_appointments_id ON public.appointments USING btree (id);


--
-- TOC entry 5444 (class 1259 OID 29609)
-- Name: ix_child_anthropometry_child_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_anthropometry_child_id ON public.child_anthropometry USING btree (child_id);


--
-- TOC entry 5445 (class 1259 OID 29610)
-- Name: ix_child_anthropometry_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_anthropometry_id ON public.child_anthropometry USING btree (id);


--
-- TOC entry 5448 (class 1259 OID 29611)
-- Name: ix_child_illness_logs_child_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_illness_logs_child_id ON public.child_illness_logs USING btree (child_id);


--
-- TOC entry 5449 (class 1259 OID 29612)
-- Name: ix_child_illness_logs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_illness_logs_id ON public.child_illness_logs USING btree (id);


--
-- TOC entry 5452 (class 1259 OID 29613)
-- Name: ix_child_meal_item_food_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_meal_item_food_id ON public.child_meal_item USING btree (food_id);


--
-- TOC entry 5453 (class 1259 OID 29614)
-- Name: ix_child_meal_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_meal_item_id ON public.child_meal_item USING btree (id);


--
-- TOC entry 5454 (class 1259 OID 29615)
-- Name: ix_child_meal_item_meal_log_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_meal_item_meal_log_id ON public.child_meal_item USING btree (meal_log_id);


--
-- TOC entry 5457 (class 1259 OID 29616)
-- Name: ix_child_meal_log_child_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_meal_log_child_id ON public.child_meal_log USING btree (child_id);


--
-- TOC entry 5458 (class 1259 OID 29617)
-- Name: ix_child_meal_log_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_meal_log_id ON public.child_meal_log USING btree (id);


--
-- TOC entry 5461 (class 1259 OID 29618)
-- Name: ix_child_medical_reports_child_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_medical_reports_child_id ON public.child_medical_reports USING btree (child_id);


--
-- TOC entry 5462 (class 1259 OID 29619)
-- Name: ix_child_medical_reports_report_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_medical_reports_report_id ON public.child_medical_reports USING btree (report_id);


--
-- TOC entry 5463 (class 1259 OID 29620)
-- Name: ix_child_medical_reports_report_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_medical_reports_report_type ON public.child_medical_reports USING btree (report_type);


--
-- TOC entry 5466 (class 1259 OID 29621)
-- Name: ix_child_milestone_status_child_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_milestone_status_child_id ON public.child_milestone_status USING btree (child_id);


--
-- TOC entry 5467 (class 1259 OID 29622)
-- Name: ix_child_milestone_status_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_milestone_status_id ON public.child_milestone_status USING btree (id);


--
-- TOC entry 5468 (class 1259 OID 29623)
-- Name: ix_child_milestone_status_milestone_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_milestone_status_milestone_id ON public.child_milestone_status USING btree (milestone_id);


--
-- TOC entry 5473 (class 1259 OID 29624)
-- Name: ix_child_milestones_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_milestones_category ON public.child_milestones USING btree (category);


--
-- TOC entry 5474 (class 1259 OID 29625)
-- Name: ix_child_milestones_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_milestones_id ON public.child_milestones USING btree (id);


--
-- TOC entry 5475 (class 1259 OID 29626)
-- Name: ix_child_milestones_milestone_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_child_milestones_milestone_code ON public.child_milestones USING btree (milestone_code);


--
-- TOC entry 5478 (class 1259 OID 29627)
-- Name: ix_child_prediction_reports_age_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_prediction_reports_age_group ON public.child_prediction_reports USING btree (age_group);


--
-- TOC entry 5479 (class 1259 OID 29628)
-- Name: ix_child_prediction_reports_child_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_prediction_reports_child_id ON public.child_prediction_reports USING btree (child_id);


--
-- TOC entry 5480 (class 1259 OID 29629)
-- Name: ix_child_prediction_reports_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_prediction_reports_id ON public.child_prediction_reports USING btree (id);


--
-- TOC entry 5639 (class 1259 OID 33664)
-- Name: ix_child_profile_photos_child_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_profile_photos_child_id ON public.child_profile_photos USING btree (child_id);


--
-- TOC entry 5640 (class 1259 OID 33663)
-- Name: ix_child_profile_photos_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_profile_photos_id ON public.child_profile_photos USING btree (id);


--
-- TOC entry 5483 (class 1259 OID 29630)
-- Name: ix_child_vaccine_status_child_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_vaccine_status_child_id ON public.child_vaccine_status USING btree (child_id);


--
-- TOC entry 5484 (class 1259 OID 29631)
-- Name: ix_child_vaccine_status_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_vaccine_status_id ON public.child_vaccine_status USING btree (id);


--
-- TOC entry 5485 (class 1259 OID 29632)
-- Name: ix_child_vaccine_status_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_child_vaccine_status_schedule_id ON public.child_vaccine_status USING btree (schedule_id);


--
-- TOC entry 5488 (class 1259 OID 29633)
-- Name: ix_children_child_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_children_child_id ON public.children USING btree (child_id);


--
-- TOC entry 5489 (class 1259 OID 29634)
-- Name: ix_children_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_children_parent_id ON public.children USING btree (parent_id);


--
-- TOC entry 5539 (class 1259 OID 32572)
-- Name: ix_custom_doctor_drug_salts_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_custom_doctor_drug_salts_id ON public.custom_doctor_drug_salts USING btree (id);


--
-- TOC entry 5521 (class 1259 OID 32358)
-- Name: ix_custom_doctor_drugs_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_custom_doctor_drugs_id ON public.custom_doctor_drugs USING btree (id);


--
-- TOC entry 5524 (class 1259 OID 32373)
-- Name: ix_doctor_auth_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_auth_doctor_id ON public.doctor_auth USING btree (doctor_id);


--
-- TOC entry 5542 (class 1259 OID 32612)
-- Name: ix_doctor_availability_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_availability_id ON public.doctor_availability USING btree (id);


--
-- TOC entry 5556 (class 1259 OID 32786)
-- Name: ix_doctor_place_role_documents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_place_role_documents_id ON public.doctor_place_role_documents USING btree (id);


--
-- TOC entry 5545 (class 1259 OID 32663)
-- Name: ix_doctor_place_roles_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_place_roles_id ON public.doctor_place_roles USING btree (id);


--
-- TOC entry 5527 (class 1259 OID 32401)
-- Name: ix_doctor_status_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_status_doctor_id ON public.doctor_status USING btree (doctor_id);


--
-- TOC entry 5530 (class 1259 OID 32442)
-- Name: ix_doctor_verification_documents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctor_verification_documents_id ON public.doctor_verification_documents USING btree (id);


--
-- TOC entry 5492 (class 1259 OID 29635)
-- Name: ix_doctors_doctor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_doctors_doctor_id ON public.doctors USING btree (doctor_id);


--
-- TOC entry 5493 (class 1259 OID 29636)
-- Name: ix_doctors_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_doctors_email ON public.doctors USING btree (email);


--
-- TOC entry 5494 (class 1259 OID 29637)
-- Name: ix_doctors_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_doctors_phone_number ON public.doctors USING btree (phone_number);


--
-- TOC entry 5497 (class 1259 OID 29638)
-- Name: ix_food_master_category_age_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_food_master_category_age_group ON public.food_master USING btree (category_age_group);


--
-- TOC entry 5498 (class 1259 OID 29639)
-- Name: ix_food_master_food_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_food_master_food_id ON public.food_master USING btree (food_id);


--
-- TOC entry 5499 (class 1259 OID 29640)
-- Name: ix_food_master_food_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_food_master_food_name ON public.food_master USING btree (food_name);


--
-- TOC entry 5500 (class 1259 OID 29641)
-- Name: ix_nutrition_recipe_age_max_months; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_nutrition_recipe_age_max_months ON public.nutrition_recipe USING btree (age_max_months);


--
-- TOC entry 5501 (class 1259 OID 29642)
-- Name: ix_nutrition_recipe_age_min_months; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_nutrition_recipe_age_min_months ON public.nutrition_recipe USING btree (age_min_months);


--
-- TOC entry 5502 (class 1259 OID 29643)
-- Name: ix_nutrition_recipe_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_nutrition_recipe_id ON public.nutrition_recipe USING btree (id);


--
-- TOC entry 5503 (class 1259 OID 29644)
-- Name: ix_nutrition_recipe_recipe_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_nutrition_recipe_recipe_code ON public.nutrition_recipe USING btree (recipe_code);


--
-- TOC entry 5506 (class 1259 OID 29645)
-- Name: ix_nutrition_requirement_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_nutrition_requirement_id ON public.nutrition_requirement USING btree (id);


--
-- TOC entry 5629 (class 1259 OID 33640)
-- Name: ix_parent_profile_photos_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_parent_profile_photos_id ON public.parent_profile_photos USING btree (id);


--
-- TOC entry 5630 (class 1259 OID 33641)
-- Name: ix_parent_profile_photos_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_parent_profile_photos_parent_id ON public.parent_profile_photos USING btree (parent_id);


--
-- TOC entry 5509 (class 1259 OID 29646)
-- Name: ix_parents_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_parents_email ON public.parents USING btree (email);


--
-- TOC entry 5510 (class 1259 OID 29647)
-- Name: ix_parents_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_parents_parent_id ON public.parents USING btree (parent_id);


--
-- TOC entry 5511 (class 1259 OID 29648)
-- Name: ix_parents_phone_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_parents_phone_number ON public.parents USING btree (phone_number);


--
-- TOC entry 5531 (class 1259 OID 32470)
-- Name: ix_places_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_places_id ON public.places USING btree (id);


--
-- TOC entry 5557 (class 1259 OID 32827)
-- Name: ix_queue_access_assignments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_access_assignments_id ON public.queue_access_assignments USING btree (id);


--
-- TOC entry 5569 (class 1259 OID 32971)
-- Name: ix_queue_assignments_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_assignments_id ON public.queue_assignments USING btree (id);


--
-- TOC entry 5560 (class 1259 OID 32898)
-- Name: ix_queue_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queue_items_id ON public.queue_items USING btree (id);


--
-- TOC entry 5546 (class 1259 OID 32700)
-- Name: ix_queues_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_queues_id ON public.queues USING btree (id);


--
-- TOC entry 5563 (class 1259 OID 32912)
-- Name: ix_staff_auth_staff_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_staff_auth_staff_id ON public.staff_auth USING btree (staff_id);


--
-- TOC entry 5566 (class 1259 OID 32946)
-- Name: ix_staff_availability_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_staff_availability_id ON public.staff_availability USING btree (id);


--
-- TOC entry 5551 (class 1259 OID 32733)
-- Name: ix_staff_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_staff_id ON public.staff USING btree (id);


--
-- TOC entry 5514 (class 1259 OID 29649)
-- Name: ix_vaccination_schedule_age_group; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vaccination_schedule_age_group ON public.vaccination_schedule USING btree (age_group);


--
-- TOC entry 5515 (class 1259 OID 29650)
-- Name: ix_vaccination_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vaccination_schedule_id ON public.vaccination_schedule USING btree (id);


--
-- TOC entry 5516 (class 1259 OID 29651)
-- Name: ix_vaccination_schedule_vaccine_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_vaccination_schedule_vaccine_name ON public.vaccination_schedule USING btree (vaccine_name);


--
-- TOC entry 5575 (class 1259 OID 33068)
-- Name: ix_visit_advice_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_advice_id ON public.visit_advice USING btree (id);


--
-- TOC entry 5578 (class 1259 OID 33096)
-- Name: ix_visit_clinical_summary_visit_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_clinical_summary_visit_id ON public.visit_clinical_summary USING btree (visit_id);


--
-- TOC entry 5581 (class 1259 OID 33128)
-- Name: ix_visit_diagnoses_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_diagnoses_id ON public.visit_diagnoses USING btree (id);


--
-- TOC entry 5584 (class 1259 OID 33163)
-- Name: ix_visit_doctors_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_doctors_id ON public.visit_doctors USING btree (id);


--
-- TOC entry 5589 (class 1259 OID 33207)
-- Name: ix_visit_documents_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_documents_id ON public.visit_documents USING btree (id);


--
-- TOC entry 5592 (class 1259 OID 33245)
-- Name: ix_visit_followups_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_followups_id ON public.visit_followups USING btree (id);


--
-- TOC entry 5609 (class 1259 OID 33432)
-- Name: ix_visit_injections_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_injections_id ON public.visit_injections USING btree (id);


--
-- TOC entry 5621 (class 1259 OID 33585)
-- Name: ix_visit_medicine_timing_medicine_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_medicine_timing_medicine_id ON public.visit_medicine_timing USING btree (medicine_id);


--
-- TOC entry 5612 (class 1259 OID 33506)
-- Name: ix_visit_medicines_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_medicines_id ON public.visit_medicines USING btree (id);


--
-- TOC entry 5597 (class 1259 OID 33282)
-- Name: ix_visit_prescription_items_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_prescription_items_id ON public.visit_prescription_items USING btree (id);


--
-- TOC entry 5615 (class 1259 OID 33535)
-- Name: ix_visit_procedures_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_procedures_id ON public.visit_procedures USING btree (id);


--
-- TOC entry 5600 (class 1259 OID 33317)
-- Name: ix_visit_referrals_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_referrals_id ON public.visit_referrals USING btree (id);


--
-- TOC entry 5603 (class 1259 OID 33349)
-- Name: ix_visit_symptoms_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_symptoms_id ON public.visit_symptoms USING btree (id);


--
-- TOC entry 5618 (class 1259 OID 33564)
-- Name: ix_visit_vaccines_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_vaccines_id ON public.visit_vaccines USING btree (id);


--
-- TOC entry 5606 (class 1259 OID 33374)
-- Name: ix_visit_vitals_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visit_vitals_id ON public.visit_vitals USING btree (id);


--
-- TOC entry 5572 (class 1259 OID 33026)
-- Name: ix_visits_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_visits_id ON public.visits USING btree (id);


--
-- TOC entry 5659 (class 2606 OID 32526)
-- Name: appointments appointments_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5660 (class 2606 OID 32531)
-- Name: appointments appointments_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5661 (class 2606 OID 32536)
-- Name: appointments appointments_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- TOC entry 5641 (class 2606 OID 29652)
-- Name: child_anthropometry child_anthropometry_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_anthropometry
    ADD CONSTRAINT child_anthropometry_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5642 (class 2606 OID 29657)
-- Name: child_illness_logs child_illness_logs_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_illness_logs
    ADD CONSTRAINT child_illness_logs_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5643 (class 2606 OID 29662)
-- Name: child_meal_item child_meal_item_food_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_meal_item
    ADD CONSTRAINT child_meal_item_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.food_master(food_id);


--
-- TOC entry 5644 (class 2606 OID 29667)
-- Name: child_meal_item child_meal_item_meal_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_meal_item
    ADD CONSTRAINT child_meal_item_meal_log_id_fkey FOREIGN KEY (meal_log_id) REFERENCES public.child_meal_log(id) ON DELETE CASCADE;


--
-- TOC entry 5645 (class 2606 OID 29672)
-- Name: child_meal_log child_meal_log_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_meal_log
    ADD CONSTRAINT child_meal_log_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5646 (class 2606 OID 29677)
-- Name: child_medical_reports child_medical_reports_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_medical_reports
    ADD CONSTRAINT child_medical_reports_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5647 (class 2606 OID 29682)
-- Name: child_milestone_status child_milestone_status_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_milestone_status
    ADD CONSTRAINT child_milestone_status_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5648 (class 2606 OID 29687)
-- Name: child_milestone_status child_milestone_status_milestone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_milestone_status
    ADD CONSTRAINT child_milestone_status_milestone_id_fkey FOREIGN KEY (milestone_id) REFERENCES public.child_milestones(id) ON DELETE CASCADE;


--
-- TOC entry 5649 (class 2606 OID 29692)
-- Name: child_prediction_reports child_prediction_reports_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_prediction_reports
    ADD CONSTRAINT child_prediction_reports_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5710 (class 2606 OID 33658)
-- Name: child_profile_photos child_profile_photos_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_profile_photos
    ADD CONSTRAINT child_profile_photos_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5650 (class 2606 OID 29697)
-- Name: child_vaccine_status child_vaccine_status_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_vaccine_status
    ADD CONSTRAINT child_vaccine_status_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5651 (class 2606 OID 29702)
-- Name: child_vaccine_status child_vaccine_status_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.child_vaccine_status
    ADD CONSTRAINT child_vaccine_status_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.vaccination_schedule(id) ON DELETE CASCADE;


--
-- TOC entry 5652 (class 2606 OID 29707)
-- Name: children children_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT children_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(parent_id) ON DELETE CASCADE;


--
-- TOC entry 5662 (class 2606 OID 32567)
-- Name: custom_doctor_drug_salts custom_doctor_drug_salts_custom_drug_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_doctor_drug_salts
    ADD CONSTRAINT custom_doctor_drug_salts_custom_drug_id_fkey FOREIGN KEY (custom_drug_id) REFERENCES public.custom_doctor_drugs(id) ON DELETE CASCADE;


--
-- TOC entry 5653 (class 2606 OID 32353)
-- Name: custom_doctor_drugs custom_doctor_drugs_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_doctor_drugs
    ADD CONSTRAINT custom_doctor_drugs_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5654 (class 2606 OID 32368)
-- Name: doctor_auth doctor_auth_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_auth
    ADD CONSTRAINT doctor_auth_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5663 (class 2606 OID 32602)
-- Name: doctor_availability doctor_availability_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5664 (class 2606 OID 32607)
-- Name: doctor_availability doctor_availability_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_availability
    ADD CONSTRAINT doctor_availability_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- TOC entry 5671 (class 2606 OID 32781)
-- Name: doctor_place_role_documents doctor_place_role_documents_doctor_place_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_place_role_documents
    ADD CONSTRAINT doctor_place_role_documents_doctor_place_role_id_fkey FOREIGN KEY (doctor_place_role_id) REFERENCES public.doctor_place_roles(id) ON DELETE CASCADE;


--
-- TOC entry 5665 (class 2606 OID 32648)
-- Name: doctor_place_roles doctor_place_roles_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_place_roles
    ADD CONSTRAINT doctor_place_roles_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5666 (class 2606 OID 32653)
-- Name: doctor_place_roles doctor_place_roles_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_place_roles
    ADD CONSTRAINT doctor_place_roles_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5667 (class 2606 OID 32658)
-- Name: doctor_place_roles doctor_place_roles_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_place_roles
    ADD CONSTRAINT doctor_place_roles_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- TOC entry 5655 (class 2606 OID 32396)
-- Name: doctor_status doctor_status_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_status
    ADD CONSTRAINT doctor_status_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5656 (class 2606 OID 32437)
-- Name: doctor_verification_documents doctor_verification_documents_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.doctor_verification_documents
    ADD CONSTRAINT doctor_verification_documents_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5709 (class 2606 OID 33635)
-- Name: parent_profile_photos parent_profile_photos_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parent_profile_photos
    ADD CONSTRAINT parent_profile_photos_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(parent_id) ON DELETE CASCADE;


--
-- TOC entry 5657 (class 2606 OID 33613)
-- Name: places places_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.addresses(id) ON DELETE SET NULL;


--
-- TOC entry 5658 (class 2606 OID 32465)
-- Name: places places_created_by_doctor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_created_by_doctor_fkey FOREIGN KEY (created_by_doctor) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5672 (class 2606 OID 32812)
-- Name: queue_access_assignments queue_access_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_access_assignments
    ADD CONSTRAINT queue_access_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5673 (class 2606 OID 32817)
-- Name: queue_access_assignments queue_access_assignments_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_access_assignments
    ADD CONSTRAINT queue_access_assignments_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- TOC entry 5674 (class 2606 OID 32822)
-- Name: queue_access_assignments queue_access_assignments_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_access_assignments
    ADD CONSTRAINT queue_access_assignments_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.queues(id) ON DELETE CASCADE;


--
-- TOC entry 5680 (class 2606 OID 32966)
-- Name: queue_assignments queue_assignments_queue_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_assignments
    ADD CONSTRAINT queue_assignments_queue_item_id_fkey FOREIGN KEY (queue_item_id) REFERENCES public.queue_items(id) ON DELETE CASCADE;


--
-- TOC entry 5675 (class 2606 OID 32883)
-- Name: queue_items queue_items_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_items
    ADD CONSTRAINT queue_items_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- TOC entry 5676 (class 2606 OID 32888)
-- Name: queue_items queue_items_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_items
    ADD CONSTRAINT queue_items_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5677 (class 2606 OID 32893)
-- Name: queue_items queue_items_queue_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queue_items
    ADD CONSTRAINT queue_items_queue_id_fkey FOREIGN KEY (queue_id) REFERENCES public.queues(id) ON DELETE CASCADE;


--
-- TOC entry 5668 (class 2606 OID 32695)
-- Name: queues queues_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.queues
    ADD CONSTRAINT queues_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- TOC entry 5678 (class 2606 OID 32907)
-- Name: staff_auth staff_auth_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_auth
    ADD CONSTRAINT staff_auth_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5679 (class 2606 OID 32941)
-- Name: staff_availability staff_availability_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff_availability
    ADD CONSTRAINT staff_availability_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;


--
-- TOC entry 5669 (class 2606 OID 32723)
-- Name: staff staff_created_by_doctor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_created_by_doctor_fkey FOREIGN KEY (created_by_doctor) REFERENCES public.doctors(doctor_id);


--
-- TOC entry 5670 (class 2606 OID 32728)
-- Name: staff staff_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- TOC entry 5685 (class 2606 OID 33058)
-- Name: visit_advice visit_advice_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_advice
    ADD CONSTRAINT visit_advice_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5686 (class 2606 OID 33063)
-- Name: visit_advice visit_advice_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_advice
    ADD CONSTRAINT visit_advice_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5687 (class 2606 OID 33091)
-- Name: visit_clinical_summary visit_clinical_summary_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_clinical_summary
    ADD CONSTRAINT visit_clinical_summary_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5688 (class 2606 OID 33118)
-- Name: visit_diagnoses visit_diagnoses_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_diagnoses
    ADD CONSTRAINT visit_diagnoses_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5689 (class 2606 OID 33123)
-- Name: visit_diagnoses visit_diagnoses_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_diagnoses
    ADD CONSTRAINT visit_diagnoses_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5690 (class 2606 OID 33153)
-- Name: visit_doctors visit_doctors_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_doctors
    ADD CONSTRAINT visit_doctors_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5691 (class 2606 OID 33158)
-- Name: visit_doctors visit_doctors_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_doctors
    ADD CONSTRAINT visit_doctors_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5692 (class 2606 OID 33197)
-- Name: visit_documents visit_documents_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_documents
    ADD CONSTRAINT visit_documents_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5693 (class 2606 OID 33202)
-- Name: visit_documents visit_documents_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_documents
    ADD CONSTRAINT visit_documents_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5694 (class 2606 OID 33235)
-- Name: visit_followups visit_followups_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_followups
    ADD CONSTRAINT visit_followups_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5695 (class 2606 OID 33240)
-- Name: visit_followups visit_followups_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_followups
    ADD CONSTRAINT visit_followups_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5702 (class 2606 OID 33422)
-- Name: visit_injections visit_injections_custom_drug_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_injections
    ADD CONSTRAINT visit_injections_custom_drug_id_fkey FOREIGN KEY (custom_drug_id) REFERENCES public.custom_doctor_drugs(id);


--
-- TOC entry 5703 (class 2606 OID 33427)
-- Name: visit_injections visit_injections_prescription_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_injections
    ADD CONSTRAINT visit_injections_prescription_item_id_fkey FOREIGN KEY (prescription_item_id) REFERENCES public.visit_prescription_items(id) ON DELETE CASCADE;


--
-- TOC entry 5708 (class 2606 OID 33580)
-- Name: visit_medicine_timing visit_medicine_timing_medicine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_medicine_timing
    ADD CONSTRAINT visit_medicine_timing_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.visit_medicines(id) ON DELETE CASCADE;


--
-- TOC entry 5704 (class 2606 OID 33496)
-- Name: visit_medicines visit_medicines_custom_drug_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_medicines
    ADD CONSTRAINT visit_medicines_custom_drug_id_fkey FOREIGN KEY (custom_drug_id) REFERENCES public.custom_doctor_drugs(id);


--
-- TOC entry 5705 (class 2606 OID 33501)
-- Name: visit_medicines visit_medicines_prescription_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_medicines
    ADD CONSTRAINT visit_medicines_prescription_item_id_fkey FOREIGN KEY (prescription_item_id) REFERENCES public.visit_prescription_items(id) ON DELETE CASCADE;


--
-- TOC entry 5696 (class 2606 OID 33272)
-- Name: visit_prescription_items visit_prescription_items_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_prescription_items
    ADD CONSTRAINT visit_prescription_items_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5697 (class 2606 OID 33277)
-- Name: visit_prescription_items visit_prescription_items_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_prescription_items
    ADD CONSTRAINT visit_prescription_items_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5706 (class 2606 OID 33530)
-- Name: visit_procedures visit_procedures_prescription_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_procedures
    ADD CONSTRAINT visit_procedures_prescription_item_id_fkey FOREIGN KEY (prescription_item_id) REFERENCES public.visit_prescription_items(id) ON DELETE CASCADE;


--
-- TOC entry 5698 (class 2606 OID 33307)
-- Name: visit_referrals visit_referrals_doctor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_referrals
    ADD CONSTRAINT visit_referrals_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(doctor_id) ON DELETE CASCADE;


--
-- TOC entry 5699 (class 2606 OID 33312)
-- Name: visit_referrals visit_referrals_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_referrals
    ADD CONSTRAINT visit_referrals_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5700 (class 2606 OID 33344)
-- Name: visit_symptoms visit_symptoms_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_symptoms
    ADD CONSTRAINT visit_symptoms_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5707 (class 2606 OID 33559)
-- Name: visit_vaccines visit_vaccines_prescription_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_vaccines
    ADD CONSTRAINT visit_vaccines_prescription_item_id_fkey FOREIGN KEY (prescription_item_id) REFERENCES public.visit_prescription_items(id) ON DELETE CASCADE;


--
-- TOC entry 5701 (class 2606 OID 33369)
-- Name: visit_vitals visit_vitals_visit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visit_vitals
    ADD CONSTRAINT visit_vitals_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES public.visits(id) ON DELETE CASCADE;


--
-- TOC entry 5681 (class 2606 OID 33006)
-- Name: visits visits_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);


--
-- TOC entry 5682 (class 2606 OID 33011)
-- Name: visits visits_child_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.children(child_id) ON DELETE CASCADE;


--
-- TOC entry 5683 (class 2606 OID 33016)
-- Name: visits visits_place_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.places(id) ON DELETE CASCADE;


--
-- TOC entry 5684 (class 2606 OID 33021)
-- Name: visits visits_queue_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_queue_item_id_fkey FOREIGN KEY (queue_item_id) REFERENCES public.queue_items(id);


--
-- TOC entry 5964 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2026-02-03 10:35:02

--
-- PostgreSQL database dump complete
--

\unrestrict jdNZfpXh6MRdg4RNhN3dLxFImxlswTGzcFyGLIxfrslSAmrFaM070EmCFu9uzgx

