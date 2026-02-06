import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  Checkbox,
  Divider,
  InputGroup,
  InputLeftAddon,
  VStack,
  HStack,
  Flex,
} from '@chakra-ui/react';
import { useAppSelector, useAppDispatch } from '../../../../redux/hooks';
import { classesApi } from '../../../../services/api';
import {
  updateFormData,
  selectStudentFormData,
} from '../../../../redux/features/students/studentSlice';

function AcademicInfoForm() {
  const dispatch = useAppDispatch();
  const formData = useAppSelector(selectStudentFormData);
  const academicInfo = formData.academic;

  const [classSections, setClassSections] = useState([]);
  const [loadingClassSections, setLoadingClassSections] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoadingClassSections(true);
    classesApi
      .list({ page: 1, pageSize: 200 })
      .then((res) => {
        const rows = Array.isArray(res?.rows) ? res.rows : Array.isArray(res) ? res : [];
        if (alive) setClassSections(rows);
      })
      .catch(() => {
        if (alive) setClassSections([]);
      })
      .finally(() => {
        if (alive) setLoadingClassSections(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  
  // Handle input changes
  const handleInputChange = (field, value) => {
    dispatch(updateFormData({ 
      step: 'academic',
      data: { [field]: value }
    }));
  };

  const resolveClassSectionId = useCallback(
    (cls, sec) => {
      const c = (cls || '').trim();
      const s = (sec || '').trim();
      if (!c || !s) return null;
      const found = classSections.find((row) => {
        const cn = (row?.className || row?.name || '').trim();
        const sn = (row?.section || '').trim();
        return cn === c && sn === s;
      });
      const id = found?.id ?? found?.classSectionId;
      if (id === undefined || id === null || id === '') return null;
      const num = Number(id);
      return Number.isFinite(num) ? num : null;
    },
    [classSections]
  );

  useEffect(() => {
    const nextId = resolveClassSectionId(academicInfo.class, academicInfo.section);
    if ((academicInfo.classSectionId ?? null) !== nextId) {
      handleInputChange('classSectionId', nextId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicInfo.class, academicInfo.section, resolveClassSectionId]);
  
  // Handle previous education fields
  const handlePreviousEducationChange = (field, value) => {
    const updatedPreviousEducation = {
      ...academicInfo.previousEducation,
      [field]: value
    };
    
    dispatch(updateFormData({
      step: 'academic',
      data: { previousEducation: updatedPreviousEducation }
    }));
  };
  
  // Generate current year and next few years for academic year dropdown
  const getCurrentAcademicYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let i = -2; i < 5; i++) {
      const year = currentYear + i;
      const nextYear = year + 1;
      years.push(`${year}-${nextYear}`);
    }
    
    return years;
  };
  
  const academicYears = getCurrentAcademicYears();

  const classOptions = useMemo(() => {
    const set = new Set();
    classSections.forEach((row) => {
      const cn = (row?.className || row?.name || '').trim();
      if (cn) set.add(cn);
    });
    const arr = Array.from(set);
    if (arr.length) return arr;
    return Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`);
  }, [classSections]);

  const sectionOptions = useMemo(() => {
    const selected = (academicInfo.class || '').trim();
    if (!selected) return ['A', 'B', 'C', 'D', 'E'];
    const set = new Set();
    classSections.forEach((row) => {
      const cn = (row?.className || row?.name || '').trim();
      if (!cn || cn !== selected) return;
      const sec = (row?.section || '').trim();
      if (sec) set.add(sec);
    });
    const arr = Array.from(set);
    return arr.length ? arr : ['A', 'B', 'C', 'D', 'E'];
  }, [classSections, academicInfo.class]);
  
  return (
    <Box>
      <Text fontSize="xl" fontWeight="600" mb={6}>
        Academic Information
      </Text>

      {/* Current Academic Information */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <FormControl id="admissionNumber" isRequired>
          <FormLabel>Admission Number</FormLabel>
          <InputGroup>
            <InputLeftAddon>ADM-</InputLeftAddon>
            <Input
              value={academicInfo.admissionNumber || ''}
              onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
              placeholder="2024-0001"
            />
          </InputGroup>
        </FormControl>
        
        <FormControl id="rollNumber" isRequired>
          <FormLabel>Roll Number</FormLabel>
          <InputGroup>
            <InputLeftAddon>STD-</InputLeftAddon>
            <Input
              value={academicInfo.rollNumber || ''}
              onChange={(e) => handleInputChange('rollNumber', e.target.value)}
              placeholder="2024-0001"
            />
          </InputGroup>
        </FormControl>
        
        <FormControl id="academicYear" isRequired>
          <FormLabel>Academic Year</FormLabel>
          <Select
            value={academicInfo.academicYear || ''}
            onChange={(e) => handleInputChange('academicYear', e.target.value)}
            placeholder="Select academic year"
          >
            {academicYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={6}>
        <FormControl id="class" isRequired>
          <FormLabel>Class</FormLabel>
          <Select
            value={academicInfo.class || ''}
            onChange={(e) => {
              const nextClass = e.target.value;
              handleInputChange('class', nextClass);
              handleInputChange('classSectionId', null);
              if (academicInfo.section && !sectionOptions.includes(academicInfo.section)) {
                handleInputChange('section', '');
              }
            }}
            placeholder="Select class"
            isDisabled={loadingClassSections}
          >
            {classOptions.map((cn) => (
              <option key={cn} value={cn}>
                {cn}
              </option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl id="section" isRequired>
          <FormLabel>Section</FormLabel>
          <Select
            value={academicInfo.section || ''}
            onChange={(e) => handleInputChange('section', e.target.value)}
            placeholder="Select section"
            isDisabled={!academicInfo.class}
          >
            {sectionOptions.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl id="stream">
          <FormLabel>Stream/Group</FormLabel>
          <Select
            value={academicInfo.stream || ''}
            onChange={(e) => handleInputChange('stream', e.target.value)}
            placeholder="Select stream"
          >
            <option value="Science">Science</option>
            <option value="Commerce">Commerce</option>
            <option value="Arts">Arts</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Biology">Biology</option>
            <option value="N/A">N/A</option>
          </Select>
          <FormHelperText>
            Applicable for higher classes only
          </FormHelperText>
        </FormControl>
      </SimpleGrid>

      <FormControl id="rfidTag" mb={6}>
        <FormLabel>RFID Tag Number</FormLabel>
        <InputGroup>
          <InputLeftAddon>RFID-</InputLeftAddon>
          <Input
            value={academicInfo.rfidTag || ''}
            onChange={(e) => handleInputChange('rfidTag', e.target.value)}
            placeholder="001"
          />
        </InputGroup>
        <FormHelperText>
          For attendance tracking and campus access
        </FormHelperText>
      </FormControl>

      <FormControl id="admissionDate" mb={6}>
        <FormLabel>Admission Date</FormLabel>
        <Input
          type="date"
          value={academicInfo.admissionDate || new Date().toISOString().split('T')[0]}
          onChange={(e) => handleInputChange('admissionDate', e.target.value)}
        />
      </FormControl>

      <Divider mb={6} />

      {/* Previous Education */}
      <Text fontSize="lg" fontWeight="600" mb={4}>
        Previous Education Details
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        <FormControl id="previousSchool">
          <FormLabel>Previous School</FormLabel>
          <Input
            value={academicInfo.previousEducation?.schoolName || ''}
            onChange={(e) => handlePreviousEducationChange('schoolName', e.target.value)}
            placeholder="Enter previous school name"
          />
        </FormControl>
        
        <FormControl id="previousClass">
          <FormLabel>Previous Class/Grade</FormLabel>
          <Input
            value={academicInfo.previousEducation?.class || ''}
            onChange={(e) => handlePreviousEducationChange('class', e.target.value)}
            placeholder="Enter previous class/grade"
          />
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        <FormControl id="lastAttended">
          <FormLabel>Last Attended Date</FormLabel>
          <Input
            type="date"
            value={academicInfo.previousEducation?.lastAttendedDate || ''}
            onChange={(e) => handlePreviousEducationChange('lastAttendedDate', e.target.value)}
          />
        </FormControl>
        
        <FormControl id="transferCertificate">
          <FormLabel>Transfer Certificate No.</FormLabel>
          <Input
            value={academicInfo.previousEducation?.transferCertificateNo || ''}
            onChange={(e) => handlePreviousEducationChange('transferCertificateNo', e.target.value)}
            placeholder="Enter TC number"
          />
        </FormControl>
      </SimpleGrid>

      <FormControl id="previousRemarks" mb={6}>
        <FormLabel>Previous School Remarks</FormLabel>
        <Textarea
          value={academicInfo.previousEducation?.remarks || ''}
          onChange={(e) => handlePreviousEducationChange('remarks', e.target.value)}
          placeholder="Enter any remarks from previous school"
        />
      </FormControl>

      <Divider mb={6} />

      {/* Special Needs */}
      <Text fontSize="lg" fontWeight="600" mb={4}>
        Special Educational Needs
      </Text>

      <FormControl id="specialNeeds" mb={4}>
        <FormLabel>Special Needs/Requirements</FormLabel>
        <Textarea
          value={academicInfo.specialNeeds || ''}
          onChange={(e) => handleInputChange('specialNeeds', e.target.value)}
          placeholder="Enter any special educational needs or requirements"
        />
      </FormControl>

      <HStack spacing={5} mb={6}>
        <Checkbox
          isChecked={academicInfo.needsExtraAttention || false}
          onChange={(e) => handleInputChange('needsExtraAttention', e.target.checked)}
        >
          Needs Extra Attention
        </Checkbox>
        <Checkbox
          isChecked={academicInfo.hasLearningDifficulties || false}
          onChange={(e) => handleInputChange('hasLearningDifficulties', e.target.checked)}
        >
          Has Learning Difficulties
        </Checkbox>
      </HStack>

      <FormControl id="accommodations" mb={6}>
        <FormLabel>Required Accommodations</FormLabel>
        <Textarea
          value={academicInfo.accommodations || ''}
          onChange={(e) => handleInputChange('accommodations', e.target.value)}
          placeholder="Enter any accommodations required"
        />
      </FormControl>
    </Box>
  );
}

export default AcademicInfoForm;
