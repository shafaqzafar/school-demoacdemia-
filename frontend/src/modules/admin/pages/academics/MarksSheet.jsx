import React, { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Select,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdAssignment, MdGrade, MdRefresh, MdSchool } from 'react-icons/md';

import Card from 'components/card/Card.js';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';

import * as classesApi from '../../../../services/api/classes';
import * as studentsApi from '../../../../services/api/students';
import * as examsApi from '../../../../services/api/exams';
import * as resultsApi from '../../../../services/api/results';

export default function MarksSheet() {
  const textSecondary = useColorModeValue('gray.600', 'gray.400');
  const headerBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'whiteAlpha.100');

  const [classRows, setClassRows] = useState([]);
  const [selectedClassKey, setSelectedClassKey] = useState('');

  const selectedClass = useMemo(() => {
    if (!selectedClassKey) return null;
    const [className, section] = selectedClassKey.split('::');
    return { className, section };
  }, [selectedClassKey]);

  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState('');

  const [examItems, setExamItems] = useState([]);
  const [examId, setExamId] = useState('');

  const [classSubjects, setClassSubjects] = useState([]);
  const [results, setResults] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const payload = await classesApi.list({ page: 1, pageSize: 500 });
        const rows = Array.isArray(payload?.rows)
          ? payload.rows
          : Array.isArray(payload)
            ? payload
            : [];

        const normalized = rows
          .map((r) => ({
            className: r.className || r.name || r.title || '',
            section: r.section || r.sectionName || '',
          }))
          .filter((r) => r.className && r.section);

        const uniqueMap = new Map();
        normalized.forEach((r) => {
          uniqueMap.set(`${r.className}::${r.section}`, r);
        });

        const unique = Array.from(uniqueMap.values()).sort((a, b) => {
          const c = String(a.className).localeCompare(String(b.className));
          if (c !== 0) return c;
          return String(a.section).localeCompare(String(b.section));
        });

        if (!mounted) return;
        setClassRows(unique);

        if (!selectedClassKey && unique.length) {
          setSelectedClassKey(`${unique[0].className}::${unique[0].section}`);
        }
      } catch (_) {
        if (!mounted) return;
        setClassRows([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedClassKey]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!selectedClass?.className || !selectedClass?.section) {
        setStudents([]);
        setStudentId('');
        setExamItems([]);
        setExamId('');
        setClassSubjects([]);
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const [studentsRes, subjectsRes, examsRes] = await Promise.all([
          studentsApi.list({
            page: 1,
            pageSize: 1000,
            class: selectedClass.className,
            section: selectedClass.section,
          }),
          classesApi.listSubjectsByClass({
            className: selectedClass.className,
            section: selectedClass.section,
          }),
          examsApi.list({
            page: 1,
            pageSize: 200,
            className: selectedClass.className,
            section: selectedClass.section,
          }),
        ]);

        const st = Array.isArray(studentsRes?.rows)
          ? studentsRes.rows
          : Array.isArray(studentsRes)
            ? studentsRes
            : [];
        const subs = Array.isArray(subjectsRes?.items)
          ? subjectsRes.items
          : Array.isArray(subjectsRes?.rows)
            ? subjectsRes.rows
            : Array.isArray(subjectsRes)
              ? subjectsRes
              : [];
        const ex = Array.isArray(examsRes?.items)
          ? examsRes.items
          : Array.isArray(examsRes?.rows)
            ? examsRes.rows
            : Array.isArray(examsRes)
              ? examsRes
              : [];

        if (!mounted) return;

        setStudents(st);
        setClassSubjects(subs);
        setExamItems(ex);

        if (!studentId && st.length) {
          setStudentId(String(st[0].id));
        }

        if (!examId && ex.length) {
          setExamId(String(ex[0].id));
        }
      } catch (_) {
        if (!mounted) return;
        setStudents([]);
        setStudentId('');
        setExamItems([]);
        setExamId('');
        setClassSubjects([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedClass, studentId, examId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!studentId || !examId) {
        setResults([]);
        return;
      }

      try {
        const data = await resultsApi.list({
          page: 1,
          pageSize: 2000,
          examId: Number(examId),
          studentId: Number(studentId),
        });
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.rows)
            ? data.rows
            : Array.isArray(data)
              ? data
              : [];
        if (!mounted) return;
        setResults(items);
      } catch (_) {
        if (!mounted) return;
        setResults([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [studentId, examId]);

  const student = useMemo(() => {
    const sid = Number(studentId);
    return students.find((s) => Number(s.id) === sid) || null;
  }, [students, studentId]);

  const exam = useMemo(() => {
    const eid = Number(examId);
    return examItems.find((e) => Number(e.id) === eid) || null;
  }, [examItems, examId]);

  const resultsBySubject = useMemo(() => {
    const m = new Map();
    results.forEach((r) => {
      if (!r?.subject) return;
      m.set(String(r.subject).trim().toLowerCase(), r);
    });
    return m;
  }, [results]);

  const rows = useMemo(() => {
    const list = [];
    const seen = new Set();

    const subjects = Array.isArray(classSubjects) ? classSubjects : [];
    subjects.forEach((s) => {
      const name = s?.subjectName || s?.name || '-';
      const key = String(name).trim().toLowerCase();
      seen.add(key);
      const r = resultsBySubject.get(key);
      const obtained = r?.marks != null && r?.marks !== '' ? Number(r.marks) : null;
      const total = s?.fullMarks != null && s?.fullMarks !== '' ? Number(s.fullMarks) : null;
      list.push({ subjectName: name, total, obtained, grade: r?.grade || null });
    });

    results.forEach((r) => {
      const name = r?.subject ? String(r.subject) : '';
      const key = name.trim().toLowerCase();
      if (!key || seen.has(key)) return;
      seen.add(key);
      const obtained = r?.marks != null && r?.marks !== '' ? Number(r.marks) : null;
      list.push({ subjectName: name, total: null, obtained, grade: r?.grade || null });
    });

    return list.sort((a, b) => String(a.subjectName).localeCompare(String(b.subjectName)));
  }, [classSubjects, resultsBySubject, results]);

  const totals = useMemo(() => {
    const totalMarks = rows.reduce((acc, r) => acc + (Number.isFinite(r.total) ? r.total : 0), 0);
    const obtainedMarks = rows.reduce((acc, r) => acc + (Number.isFinite(r.obtained) ? r.obtained : 0), 0);
    const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
    return {
      subjects: rows.length,
      totalMarks,
      obtainedMarks,
      percentage,
    };
  }, [rows]);

  const reset = () => {
    setSelectedClassKey(classRows.length ? `${classRows[0].className}::${classRows[0].section}` : '');
    setStudentId('');
    setExamId('');
    setResults([]);
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <Text fontSize='2xl' fontWeight='bold' mb='6px'>Marks Sheet</Text>
      <Text fontSize='md' color={textSecondary} mb='16px'>Select class, exam and student to view subject-wise marks</Text>

      <Box mb='16px'>
        <Flex gap='16px' w='100%' wrap='nowrap'>
          <MiniStatistics
            compact
            startContent={<IconBox w='44px' h='44px' bg='linear-gradient(90deg,#4481EB 0%,#04BEFE 100%)' icon={<MdSchool color='white' />} />}
            name='Subjects'
            value={String(totals.subjects)}
            trendData={[1, 1, 1, 1, 1, 1]}
            trendColor='#4481EB'
          />
          <MiniStatistics
            compact
            startContent={<IconBox w='44px' h='44px' bg='linear-gradient(90deg,#01B574 0%,#51CB97 100%)' icon={<MdAssignment color='white' />} />}
            name='Total'
            value={String(totals.totalMarks)}
            trendData={[1, 1, 1, 1, 1, 1]}
            trendColor='#01B574'
          />
          <MiniStatistics
            compact
            startContent={<IconBox w='44px' h='44px' bg='linear-gradient(90deg,#B721FF 0%,#21D4FD 100%)' icon={<MdGrade color='white' />} />}
            name='Obtained'
            value={String(totals.obtainedMarks)}
            trendData={[1, 1, 1, 1, 1, 1]}
            trendColor='#B721FF'
          />
        </Flex>
      </Box>

      <Card p='16px' mb='16px'>
        <Flex gap={3} flexWrap='wrap' justify='space-between' align='center'>
          <HStack spacing={3} flexWrap='wrap' rowGap={3}>
            <Select
              placeholder='Class'
              value={selectedClassKey}
              onChange={(e) => {
                setSelectedClassKey(e.target.value);
                setStudentId('');
                setExamId('');
                setResults([]);
              }}
              size='sm'
              maxW='260px'
              isDisabled={loading || !classRows.length}
            >
              {classRows.map((c) => (
                <option key={`${c.className}::${c.section}`} value={`${c.className}::${c.section}`}>
                  {c.className}-{c.section}
                </option>
              ))}
            </Select>

            <Select
              placeholder='Exam'
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              size='sm'
              maxW='280px'
              isDisabled={loading || !examItems.length}
            >
              {examItems.map((e) => (
                <option key={e.id} value={String(e.id)}>
                  {e.title || e.examTitle || `Exam ${e.id}`}
                </option>
              ))}
            </Select>

            <Select
              placeholder='Student'
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              size='sm'
              maxW='320px'
              isDisabled={loading || !students.length}
            >
              {students.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}{s.rollNumber ? ` (${s.rollNumber})` : ''}
                </option>
              ))}
            </Select>
          </HStack>

          <HStack>
            <Button size='sm' variant='outline' leftIcon={<Icon as={MdRefresh} />} onClick={reset}>
              Reset
            </Button>
          </HStack>
        </Flex>
      </Card>

      <Card p='16px' mb='16px'>
        <Flex justify='space-between' align='flex-start' gap={6} flexWrap='wrap'>
          <Box>
            <Text fontWeight='700'>Student</Text>
            <Text fontSize='sm' color={textSecondary}>
              {student ? `${student.name}${student.rollNumber ? ` (${student.rollNumber})` : ''}` : '-'}
            </Text>
          </Box>
          <Box>
            <Text fontWeight='700'>Class</Text>
            <Text fontSize='sm' color={textSecondary}>
              {selectedClass ? `${selectedClass.className}-${selectedClass.section}` : '-'}
            </Text>
          </Box>
          <Box>
            <Text fontWeight='700'>Exam</Text>
            <Text fontSize='sm' color={textSecondary}>
              {exam ? (exam.title || exam.examTitle || '-') : '-'}
            </Text>
          </Box>
          <Box>
            <Text fontWeight='700'>Percentage</Text>
            <Text fontSize='sm' color={textSecondary}>
              <Badge colorScheme={totals.percentage >= 80 ? 'green' : totals.percentage >= 60 ? 'yellow' : 'red'}>{totals.percentage}%</Badge>
            </Text>
          </Box>
        </Flex>
      </Card>

      <Card p='0'>
        <Box overflowX='auto'>
          <Box minW='760px'>
            <Table size='sm' variant='striped' colorScheme='gray'>
              <Thead bg={headerBg} position='sticky' top={0} zIndex={1} boxShadow='sm'>
                <Tr>
                  <Th>Subject</Th>
                  <Th isNumeric>Total Marks</Th>
                  <Th isNumeric>Obtained</Th>
                  <Th>Grade</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((r, idx) => (
                  <Tr key={`${r.subjectName}-${idx}`} _hover={{ bg: hoverBg }}>
                    <Td>{r.subjectName}</Td>
                    <Td isNumeric>{Number.isFinite(r.total) ? r.total : '-'}</Td>
                    <Td isNumeric>
                      {Number.isFinite(r.obtained) ? (
                        <Badge colorScheme={r.total != null && Number.isFinite(r.total) && r.obtained >= r.total ? 'green' : 'blue'}>
                          {r.obtained}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </Td>
                    <Td>{r.grade ? <Badge>{r.grade}</Badge> : '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {!rows.length && (
              <Box p='16px'>
                <Text fontSize='sm' color={textSecondary}>
                  {loading ? 'Loading...' : 'No subjects found for this class. Please add class subjects first.'}
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
