import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Patient, PatientStatus } from './entities/patient.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(createPatientDto: CreatePatientDto): Promise<Patient> {
    const patient = this.patientRepository.create(createPatientDto);
    return this.patientRepository.save(patient);
  }

  async findAll(): Promise<Patient[]> {
    return this.patientRepository.find({
      relations: ['subscriptions', 'clinical_records'],
      select: {
        id: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        gender: true,
        document_type: true,
        document_number: true,
        phone: true,
        patient_status: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id },
      relations: ['subscriptions', 'clinical_records'],
      select: {
        id: true,
        first_name: true,
        last_name: true,
        birth_date: true,
        gender: true,
        document_type: true,
        document_number: true,
        address: true,
        city: true,
        state: true,
        zip_code: true,
        phone: true,
        secondary_phone: true,
        emergency_contact_name: true,
        emergency_contact_phone: true,
        blood_type: true,
        allergies: true,
        medical_conditions: true,
        patient_status: true,
        medical_record_number: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    return patient;
  }

  async findByPhone(phone: string): Promise<Patient | null> {
    return this.patientRepository.findOne({
      where: { phone },
    });
  }

  async findByDocument(documentNumber: string): Promise<Patient | null> {
    return this.patientRepository.findOne({
      where: { document_number: documentNumber },
    });
  }

  async update(
    id: string,
    updatePatientDto: UpdatePatientDto,
  ): Promise<Patient> {
    const patient = await this.findOne(id);

    // Update the patient with the new data
    Object.assign(patient, updatePatientDto);
    patient.updated_at = new Date();

    return this.patientRepository.save(patient);
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    await this.patientRepository.remove(patient);
  }

  async activatePatient(id: string): Promise<Patient> {
    const patient = await this.findOne(id);
    patient.patient_status = PatientStatus.ACTIVE;
    patient.updated_at = new Date();
    return this.patientRepository.save(patient);
  }

  async deactivatePatient(id: string): Promise<Patient> {
    const patient = await this.findOne(id);
    patient.patient_status = PatientStatus.INACTIVE;
    patient.updated_at = new Date();
    return this.patientRepository.save(patient);
  }

  async findActivePatients(): Promise<Patient[]> {
    return this.patientRepository.find({
      where: { patient_status: PatientStatus.ACTIVE },

      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone: true,
        patient_status: true,
      },
    });
  }
}
